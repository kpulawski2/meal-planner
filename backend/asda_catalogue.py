"""Build a complete ASDA catalogue from the public search index used by ASDA.com.

ASDA currently publishes its grocery and George-in-groceries products through a
read-only Algolia search index. The search key below is the public search-only
key shipped to every visitor's browser; it cannot write to the index. We use
the same category filters as the website and fail closed if any category or
page is missing.
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
import re
import tempfile
import threading
import time
import unicodedata
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable
from urllib.parse import urlsplit

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

ASDA = "https://www.asda.com"
ALGOLIA_APP_ID = os.environ.get("ASDA_ALGOLIA_APP_ID") or "8I6WSKCCNV"
# This public key is delivered by ASDA's site configuration and is search-only.
ALGOLIA_SEARCH_KEY = os.environ.get("ASDA_ALGOLIA_SEARCH_KEY") or "03e4272048dd17f771da37b57ff8a75e"
ALGOLIA_INDEX = os.environ.get("ASDA_ALGOLIA_INDEX") or "ASDA_PRODUCTS"
ALGOLIA_QUERY_URL = f"https://{ALGOLIA_APP_ID.lower()}-dsn.algolia.net/1/indexes/{ALGOLIA_INDEX}/query"
BASE_FILTER = "STATUS:A AND DISPLAY_ONLINE:true"
REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PRODUCTS_PATH = REPO_ROOT / "data" / "products.json"
TIMEOUT = max(5, int(os.environ.get("REQUEST_TIMEOUT", "30")))
WORKERS = max(1, min(12, int(os.environ.get("CATALOGUE_WORKERS", "6"))))
RETRY_TOTAL = max(1, int(os.environ.get("REQUEST_RETRIES", "4")))
HITS_PER_PAGE = 1000
MAX_RETRIEVABLE_HITS = 20_000
MIN_CATALOGUE_PRODUCTS = max(1, int(os.environ.get("MIN_CATALOGUE_PRODUCTS", "100")))
FACET_FIELDS = (
    "PRIMARY_TAXONOMY.DEPT_NAME",
    "PRIMARY_TAXONOMY.AISLE_NAME",
    "PRIMARY_TAXONOMY.SHELF_NAME",
)
ATTRIBUTES = [
    "objectID", "ID", "CIN", "NAME", "BRAND", "IMAGE_ID", "PACK_SIZE", "PRICES",
    "PRIMARY_TAXONOMY", "NUTRITIONAL_INFO", "LIFESTYLES", "STATUS", "DISPLAY_ONLINE",
    "PRODUCT_TYPE", "SKU_TYPE_IDENTIFIER", "GTIN", "EAN", "BARCODE",
]
LOG = logging.getLogger(__name__)
_thread_local = threading.local()
_status_cache: dict[str, Any] | None = None


class CatalogueRefreshError(RuntimeError):
    """Raised when the public product index is unavailable or incomplete."""


def _new_session() -> requests.Session:
    retry = Retry(
        total=RETRY_TOTAL,
        connect=RETRY_TOTAL,
        read=RETRY_TOTAL,
        status=RETRY_TOTAL,
        backoff_factor=0.7,
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=frozenset({"POST"}),
        respect_retry_after_header=True,
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retry, pool_connections=WORKERS, pool_maxsize=WORKERS)
    session = requests.Session()
    session.mount("https://", adapter)
    session.headers.update(
        {
            "X-Algolia-Application-Id": ALGOLIA_APP_ID,
            "X-Algolia-API-Key": ALGOLIA_SEARCH_KEY,
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "MealPlannerCatalogue/5.0 (+https://github.com/kpulawski2/meal-planner)",
        }
    )
    return session


def search_index(
    *,
    filters: str | None = None,
    page: int = 0,
    hits_per_page: int = HITS_PER_PAGE,
    facets: list[str] | None = None,
    max_values_per_facet: int = 1000,
) -> dict[str, Any]:
    """Issue a bounded, retryable read against ASDA's public search index."""
    session = getattr(_thread_local, "session", None)
    if session is None:
        session = _new_session()
        _thread_local.session = session

    body: dict[str, Any] = {
        "query": "",
        "page": page,
        "hitsPerPage": hits_per_page,
        "attributesToRetrieve": ATTRIBUTES if not facets else ["objectID"],
    }
    if filters:
        body["filters"] = filters
    if facets is not None:
        body["facets"] = facets
        body["maxValuesPerFacet"] = max_values_per_facet

    try:
        response = session.post(ALGOLIA_QUERY_URL, json=body, timeout=(10, TIMEOUT))
        response.raise_for_status()
        result = response.json()
    except (requests.RequestException, ValueError) as exc:
        raise CatalogueRefreshError(f"ASDA product search request failed: {exc}") from exc
    if not isinstance(result, dict) or not isinstance(result.get("hits"), list):
        raise CatalogueRefreshError("ASDA returned an invalid product search response.")
    return result


def _filter_value(attribute: str, value: str) -> str:
    escaped = str(value).replace("\\", "\\\\").replace('"', '\\"')
    return f'{attribute}:"{escaped}"'


def _combine_filters(*parts: str) -> str:
    return " AND ".join(f"({part})" for part in parts if part)


def _exact_count(result: dict[str, Any], context: str) -> int:
    if result.get("exhaustiveNbHits") is not True:
        raise CatalogueRefreshError(f"ASDA did not confirm an exact result count for {context}.")
    try:
        count = int(result["nbHits"])
    except (KeyError, TypeError, ValueError) as exc:
        raise CatalogueRefreshError(f"ASDA returned no valid result count for {context}.") from exc
    if count < 0:
        raise CatalogueRefreshError(f"ASDA returned a negative result count for {context}.")
    return count


def _facet_counts(result: dict[str, Any], field: str, context: str) -> dict[str, int]:
    raw = result.get("facets", {}).get(field)
    if not isinstance(raw, dict):
        raise CatalogueRefreshError(f"ASDA omitted the {field} categories for {context}.")
    try:
        return {str(name): int(count) for name, count in raw.items() if int(count) > 0}
    except (TypeError, ValueError) as exc:
        raise CatalogueRefreshError(f"ASDA returned invalid {field} counts for {context}.") from exc


def _discover_partitions(
    category_counts: dict[str, int],
    search_fn: Callable[..., dict[str, Any]],
) -> list[tuple[str, int]]:
    """Partition each primary category below Algolia's 20,000-hit page ceiling."""
    partitions: list[tuple[str, int]] = []

    def expand(filters: str, count: int, level: int, context: str) -> None:
        if count <= 0:
            return
        if count <= MAX_RETRIEVABLE_HITS:
            partitions.append((filters, count))
            return
        if level >= len(FACET_FIELDS):
            raise CatalogueRefreshError(
                f"ASDA category {context} has {count} products and cannot be safely split below 20,000."
            )
        field = FACET_FIELDS[level]
        result = search_fn(filters=filters, page=0, hits_per_page=1, facets=[field], max_values_per_facet=1000)
        exact_count = _exact_count(result, context)
        if exact_count != count:
            raise CatalogueRefreshError(f"ASDA changed the {context} count while catalogue discovery was running.")
        children = _facet_counts(result, field, context)
        if not children or sum(children.values()) != count:
            raise CatalogueRefreshError(
                f"ASDA's {field} facet covers {sum(children.values())} of {count} products in {context}."
            )
        for name, child_count in sorted(children.items(), key=lambda item: item[0].casefold()):
            child_filter = _combine_filters(filters, _filter_value(field, name))
            expand(child_filter, child_count, level + 1, f"{context} / {name}")

    for category, count in sorted(category_counts.items(), key=lambda item: item[0].casefold()):
        category_filter = _combine_filters(BASE_FILTER, _filter_value("PRIMARY_TAXONOMY.CAT_NAME", category))
        expand(category_filter, count, 0, category)
    return partitions


def parse_quantity(value: Any) -> tuple[float | None, str | None]:
    """Parse common customer-facing pack sizes into a base-unit quantity."""
    if value is None:
        return None, None
    text = str(value).strip().lower().replace(",", "").replace("×", "x")
    units = r"kilograms?|kg|grams?|g|litres?|liters?|litre|liter|l|millilitres?|milliliters?|ml|cl|pints?|pt|ounces?|oz"
    multi = re.search(rf"(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*({units})\b", text)
    if multi:
        multiplier, amount, unit = multi.groups()
        quantity = float(multiplier) * float(amount)
    else:
        single = re.search(rf"(\d+(?:\.\d+)?)\s*({units})\b", text)
        if single:
            amount, unit = single.groups()
            quantity = float(amount)
        else:
            count = re.search(r"(\d+)\s*(?:pieces?|each|pack|pk|count|ct)\b", text)
            return (float(count.group(1)), "pieces") if count else (None, None)

    if unit in {"kg", "kilogram", "kilograms"}:
        return quantity * 1000, "g"
    if unit in {"l", "litre", "litres", "liter", "liters"}:
        return quantity * 1000, "ml"
    if unit in {"cl"}:
        return quantity * 10, "ml"
    if unit in {"pint", "pints", "pt"}:
        return quantity * 568.26125, "ml"
    if unit in {"oz", "ounce", "ounces"}:
        return quantity * 28.349523125, "g"
    if unit in {"gram", "grams"}:
        unit = "g"
    if unit in {"millilitre", "millilitres", "milliliter", "milliliters"}:
        unit = "ml"
    return quantity, unit


def _slug(value: str) -> str:
    ascii_value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii").lower()
    # Keep a trailing dash for terminal punctuation (e.g. the site's "1+" slug).
    return re.sub(r"[^a-z0-9]+", "-", ascii_value).lstrip("-")


def _number(value: Any) -> float | None:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if number >= 0 else None


def _display_name(brand: str | None, name: str) -> str:
    if not brand or name.casefold().startswith(brand.casefold()):
        return name.strip()
    return f"{brand.strip()} {name.strip()}"


def _taxonomy(hit: dict[str, Any]) -> tuple[list[str], str]:
    taxonomy = hit.get("PRIMARY_TAXONOMY")
    if not isinstance(taxonomy, dict):
        taxonomy = {}
    values = []
    for key in ("CAT_NAME", "DEPT_NAME", "AISLE_NAME", "SHELF_NAME"):
        value = str(taxonomy.get(key) or "").strip()
        if value and (not values or value.casefold() != values[-1].casefold()):
            values.append(value)
    category = " > ".join(values) if values else "ASDA Groceries"
    return values, category


def product_from_hit(hit: dict[str, Any], checked_at: str) -> dict[str, Any]:
    """Convert one official search-index record into the app's product schema."""
    object_id = str(hit.get("objectID") or hit.get("CIN") or "").strip()
    raw_name = str(hit.get("NAME") or "").strip()
    if not object_id or not raw_name:
        raise CatalogueRefreshError("ASDA returned a product without a stable ID or name.")
    brand = str(hit.get("BRAND") or "").strip() or None
    name = _display_name(brand, raw_name)
    taxonomy_values, category = _taxonomy(hit)
    route_category = taxonomy_values[-1] if taxonomy_values else "ASDA Groceries"
    url = f"{ASDA}/groceries/product/{_slug(route_category)}/{_slug(name)}/{object_id}"

    price_rows: dict[str, dict[str, Any]] = {}
    raw_prices = hit.get("PRICES")
    if isinstance(raw_prices, dict):
        for region in ("EN", "NI", "SC", "WA"):
            row = raw_prices.get(region)
            if not isinstance(row, dict):
                continue
            price = _number(row.get("PRICE"))
            if price is None:
                continue
            unit_price = _number(row.get("PRICEPERUOM"))
            price_rows[region] = {
                "price": price,
                "unitPrice": unit_price,
                "unitPriceLabel": str(row.get("PRICEPERUOMFORMATTED") or "").strip() or None,
                "offer": str(row.get("OFFER") or "").strip() or None,
            }

    chosen_region = "EN" if "EN" in price_rows else next(iter(price_rows), None)
    chosen_price = price_rows.get(chosen_region, {}) if chosen_region else {}
    pack_size = str(hit.get("PACK_SIZE") or "").strip() or None
    pack_quantity, pack_unit = parse_quantity(pack_size)
    image_id = str(hit.get("IMAGE_ID") or "").strip() or None
    image = (
        f"https://asdagroceries.scene7.com/is/image/asdagroceries/{image_id}?$ProdListProd$&dpr=on,1"
        if image_id
        else None
    )
    nutrition_flags = hit.get("NUTRITIONAL_INFO") if isinstance(hit.get("NUTRITIONAL_INFO"), dict) else {}
    dietary_attributes = [key for key, value in nutrition_flags.items() if value in (1, True, "1", "true")]
    lifestyles = hit.get("LIFESTYLES")
    if isinstance(lifestyles, list):
        dietary_attributes.extend(str(value).strip() for value in lifestyles if str(value).strip())
    dietary_attributes = list(dict.fromkeys(dietary_attributes))
    gtin = next((str(hit[key]).strip() for key in ("GTIN", "EAN", "BARCODE") if hit.get(key)), None)
    sku = str(hit.get("CIN") or object_id).strip()
    price = chosen_price.get("price")
    quantity_base_unit = price / pack_quantity if price is not None and pack_quantity else None

    return {
        "id": f"asda-{object_id}",
        "name": name,
        "brand": brand,
        "packSize": pack_size,
        "packQuantity": pack_quantity,
        "packUnit": pack_unit,
        "price": price,
        "priceRegion": chosen_region,
        "pricesByRegion": price_rows,
        "pricePerBaseUnit": round(quantity_base_unit, 8) if quantity_base_unit is not None else None,
        "pricePerUnit": chosen_price.get("unitPrice"),
        "pricePerUnitLabel": chosen_price.get("unitPriceLabel"),
        "offer": chosen_price.get("offer"),
        "url": url,
        "image": image,
        "category": category,
        "sku": sku,
        "availability": "listed_online",
        "nutritionClaims": dietary_attributes,
        "checkedAt": checked_at,
        **({"gtin": gtin} if gtin else {}),
    }


def _read_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None


def _healthy_previous_count(products_path: Path, metadata_path: Path) -> int:
    metadata = _read_json(metadata_path)
    products = _read_json(products_path)
    if (
        isinstance(metadata, dict)
        and metadata.get("status") == "complete"
        and isinstance(products, list)
        and len(products) == metadata.get("products_saved") == metadata.get("products_expected")
        and metadata.get("coverage") == 1.0
    ):
        return len(products)
    return 0


def validate_catalogue(
    products: list[dict[str, Any]],
    expected_count: int,
    previous_count: int = 0,
    minimum_products: int = MIN_CATALOGUE_PRODUCTS,
) -> None:
    if expected_count < minimum_products or len(products) < minimum_products:
        raise CatalogueRefreshError(
            f"Catalogue validation rejected {len(products)} of {expected_count} products; "
            f"at least {minimum_products} are required."
        )
    if len(products) != expected_count:
        raise CatalogueRefreshError(
            f"Incomplete catalogue: received {len(products)} of {expected_count} active online products."
        )
    ids = [product.get("id") for product in products]
    urls = [product.get("url") for product in products]
    if any(not value for value in ids) or len(set(ids)) != len(ids):
        raise CatalogueRefreshError("Catalogue contains missing or duplicate stable product IDs.")
    if any(not value for value in urls) or len(set(urls)) != len(urls):
        raise CatalogueRefreshError("Catalogue contains missing or duplicate product URLs.")
    for product in products:
        url = str(product.get("url", ""))
        parsed = urlsplit(url)
        if parsed.scheme != "https" or parsed.hostname != "www.asda.com" or "/groceries/product/" not in parsed.path:
            raise CatalogueRefreshError(f"Catalogue contains a non-ASDA product URL: {url}")
        if not str(product.get("name", "")).strip():
            raise CatalogueRefreshError(f"Catalogue contains a product without a name: {url}")
        price = product.get("price")
        if price is not None and (not isinstance(price, (int, float)) or price < 0):
            raise CatalogueRefreshError(f"Catalogue contains an invalid price: {url}")
        if product.get("availability") != "listed_online":
            raise CatalogueRefreshError(f"Catalogue contains a product not marked active and online: {url}")
    if previous_count >= minimum_products and len(products) < int(previous_count * 0.8):
        raise CatalogueRefreshError(
            f"Catalogue validation rejected a drop from {previous_count} to {len(products)} products (below the 80% safety threshold)."
        )


def _atomic_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp_path: Path | None = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w", encoding="utf-8", dir=path.parent, prefix=f".{path.name}.", suffix=".tmp", delete=False
        ) as handle:
            temp_path = Path(handle.name)
            json.dump(value, handle, ensure_ascii=False, separators=(",", ":"))
            handle.write("\n")
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temp_path, path)
    finally:
        if temp_path and temp_path.exists():
            temp_path.unlink()


def crawl(
    *,
    output_path: str | Path | None = None,
    metadata_path: str | Path | None = None,
    search_fn: Callable[..., dict[str, Any]] | None = None,
) -> list[dict[str, Any]]:
    """Fetch every active, online ASDA product and publish only a full snapshot."""
    products_path = Path(output_path or os.environ.get("PRODUCT_OUT", str(DEFAULT_PRODUCTS_PATH))).resolve()
    meta_path = Path(metadata_path or products_path.with_name("catalogue-meta.json")).resolve()
    search = search_fn or search_index
    started = time.monotonic()

    root = search(
        filters=BASE_FILTER,
        page=0,
        hits_per_page=1,
        facets=["PRIMARY_TAXONOMY.CAT_NAME"],
        max_values_per_facet=1000,
    )
    expected_count = _exact_count(root, "the full active online ASDA catalogue")
    category_counts = _facet_counts(root, "PRIMARY_TAXONOMY.CAT_NAME", "the full active online ASDA catalogue")
    if not category_counts or sum(category_counts.values()) != expected_count:
        raise CatalogueRefreshError(
            f"ASDA category facets cover {sum(category_counts.values())} of {expected_count} active online products."
        )
    partitions = _discover_partitions(category_counts, search)
    if sum(count for _, count in partitions) != expected_count:
        raise CatalogueRefreshError("Category partitions do not add up to ASDA's exhaustive product count.")

    page_jobs: list[tuple[str, int, int]] = []
    for filters, count in partitions:
        if count > MAX_RETRIEVABLE_HITS:
            raise CatalogueRefreshError(f"A category query still exceeds Algolia's page limit: {count} products.")
        for page in range((count + HITS_PER_PAGE - 1) // HITS_PER_PAGE):
            expected_page_size = min(HITS_PER_PAGE, count - page * HITS_PER_PAGE)
            page_jobs.append((filters, page, expected_page_size))

    LOG.info(
        "ASDA reports %d active online products in %d primary categories; fetching %d pages with %d workers",
        expected_count,
        len(category_counts),
        len(page_jobs),
        WORKERS,
    )
    hits: list[dict[str, Any]] = []
    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futures = {
            pool.submit(search, filters=filters, page=page, hits_per_page=HITS_PER_PAGE):
                (filters, page, expected_size)
            for filters, page, expected_size in page_jobs
        }
        for processed, future in enumerate(as_completed(futures), start=1):
            filters, page, expected_size = futures[future]
            try:
                response = future.result()
            except Exception as exc:
                raise CatalogueRefreshError(f"ASDA catalogue page {page} failed: {exc}") from exc
            page_hits = response.get("hits")
            if not isinstance(page_hits, list) or len(page_hits) != expected_size:
                count = len(page_hits) if isinstance(page_hits, list) else "invalid"
                raise CatalogueRefreshError(
                    f"Incomplete ASDA catalogue page {page}: received {count} records, expected {expected_size}."
                )
            hits.extend(page_hits)
            if processed % 10 == 0 or processed == len(page_jobs):
                LOG.info("Fetched %d/%d ASDA result pages (%d products)", processed, len(page_jobs), len(hits))

    if len(hits) != expected_count:
        raise CatalogueRefreshError(f"ASDA returned {len(hits)} products; its exact category count was {expected_count}.")
    for hit in hits:
        if hit.get("STATUS") != "A" or hit.get("DISPLAY_ONLINE") is not True:
            raise CatalogueRefreshError("ASDA returned an inactive or non-online product in the active catalogue query.")
    final_root = search(
        filters=BASE_FILTER,
        page=0,
        hits_per_page=1,
        facets=["PRIMARY_TAXONOMY.CAT_NAME"],
        max_values_per_facet=1000,
    )
    final_count = _exact_count(final_root, "the final active online ASDA catalogue check")
    final_categories = _facet_counts(final_root, "PRIMARY_TAXONOMY.CAT_NAME", "the final active online ASDA catalogue check")
    if final_count != expected_count or final_categories != category_counts:
        raise CatalogueRefreshError("ASDA's active product counts changed during refresh; the previous snapshot was kept.")
    checked_at = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    records = [product_from_hit(hit, checked_at) for hit in hits]
    records.sort(key=lambda product: (str(product.get("name", "")).casefold(), str(product.get("id", ""))))

    # Duplicate IDs could arise if ASDA assigns a product to multiple categories;
    # dedupe only when the underlying official object is identical.
    by_id: dict[str, dict[str, Any]] = {}
    for product in records:
        previous = by_id.get(product["id"])
        if previous and previous != product:
            raise CatalogueRefreshError(f"ASDA returned conflicting product data for {product['id']}.")
        by_id[product["id"]] = product
    records = list(by_id.values())
    previous_count = _healthy_previous_count(products_path, meta_path)
    validate_catalogue(records, expected_count, previous_count=previous_count)

    elapsed = round(time.monotonic() - started, 2)
    metadata = {
        "schema_version": 3,
        "status": "complete",
        "source": "ASDA official ASDA_PRODUCTS public search index",
        "source_url": "https://www.asda.com/groceries/search",
        "refreshed_at": checked_at,
        "last_successful_at": checked_at,
        "duration_seconds": elapsed,
        "index_hits": int(root["nbHits"]),
        "products_expected": expected_count,
        "products_saved": len(records),
        "pages_fetched": len(page_jobs),
        "category_count": len(category_counts),
        "category_counts": category_counts,
        "category_partitions": len(partitions),
        "coverage": 1.0,
        "with_price": sum(product.get("price") is not None for product in records),
        "with_regional_prices": sum(bool(product.get("pricesByRegion")) for product in records),
        "with_pack_size": sum(product.get("packSize") is not None for product in records),
        "with_sku": sum(product.get("sku") is not None for product in records),
        "with_gtin": sum(product.get("gtin") is not None for product in records),
        "with_brand": sum(product.get("brand") is not None for product in records),
        "with_category": sum(product.get("category") is not None for product in records),
        "with_availability": len(records),
        "with_image": sum(product.get("image") is not None for product in records),
        "with_nutrition": sum(bool(product.get("nutrition")) for product in records),
        "with_nutrition_claims": sum(bool(product.get("nutritionClaims")) for product in records),
        "availability_note": "Listed online in ASDA's catalogue; store stock varies by location.",
        "nutrition_note": "ASDA's public search index includes dietary claims; full nutrition tables remain on product pages.",
        "price_note": "Prices are shown by ASDA region; the app defaults to England when available.",
    }

    # Files are replaced only after discovery, every page, deduplication, and
    # validation have all succeeded. A transient/partial result never publishes.
    _atomic_json(products_path, records)
    _atomic_json(meta_path, metadata)
    LOG.info("Published %d validated ASDA products in %.2fs", len(records), elapsed)
    return records


def read_catalogue_status(
    products_path: str | Path | None = None,
    metadata_path: str | Path | None = None,
) -> dict[str, Any]:
    global _status_cache
    product_file = Path(products_path or os.environ.get("PRODUCT_OUT", str(DEFAULT_PRODUCTS_PATH))).resolve()
    meta_file = Path(metadata_path or product_file.with_name("catalogue-meta.json")).resolve()
    metadata = _read_json(meta_file)
    try:
        product_stat = product_file.stat()
        metadata_stat = meta_file.stat()
        fingerprint = (
            str(product_file), product_stat.st_mtime_ns, product_stat.st_size,
            str(meta_file), metadata_stat.st_mtime_ns, metadata_stat.st_size,
        )
    except OSError:
        fingerprint = None
    if fingerprint is not None and _status_cache and _status_cache.get("fingerprint") == fingerprint:
        return dict(_status_cache["status"])

    products = _read_json(product_file)
    if not isinstance(metadata, dict):
        metadata = {"status": "unavailable", "source": "ASDA official product search index"}
    metadata = dict(metadata)
    recorded_count = metadata.get("products_saved")
    actual_count = len(products) if isinstance(products, list) else 0
    metadata["products_saved"] = actual_count
    metadata["healthy"] = (
        metadata.get("status") == "complete"
        and isinstance(products, list)
        and actual_count == recorded_count == metadata.get("products_expected")
        and metadata.get("coverage") == 1.0
    )
    if fingerprint is not None:
        _status_cache = {"fingerprint": fingerprint, "status": metadata}
    return metadata
