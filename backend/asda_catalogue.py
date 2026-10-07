"""Build a validated, complete snapshot of ASDA's published grocery catalogue."""

from __future__ import annotations

import gzip
import hashlib
import json
import logging
import os
import re
import tempfile
import threading
import time
import xml.etree.ElementTree as ET
from collections import deque
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable
from urllib.parse import urlsplit, urlunsplit

import requests
from bs4 import BeautifulSoup
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

ASDA = "https://www.asda.com"
SITEMAP_INDEX = f"{ASDA}/sitemap-index.xml"
REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PRODUCTS_PATH = REPO_ROOT / "data" / "products.json"
USER_AGENT = os.environ.get(
    "ASDA_USER_AGENT",
    "MealPlannerCatalogue/4.0 (+https://github.com/kpulawski2/meal-planner)",
)
TIMEOUT = max(5, int(os.environ.get("REQUEST_TIMEOUT", "30")))
WORKERS = max(1, min(16, int(os.environ.get("CATALOGUE_WORKERS", "8"))))
MIN_CATALOGUE_PRODUCTS = max(1, int(os.environ.get("MIN_CATALOGUE_PRODUCTS", "100")))
RETRY_TOTAL = max(1, int(os.environ.get("REQUEST_RETRIES", "4")))
LOG = logging.getLogger(__name__)
_thread_local = threading.local()


class CatalogueRefreshError(RuntimeError):
    """Raised when discovery or validation indicates an incomplete catalogue."""


def _new_session() -> requests.Session:
    retry = Retry(
        total=RETRY_TOTAL,
        connect=RETRY_TOTAL,
        read=RETRY_TOTAL,
        status=RETRY_TOTAL,
        backoff_factor=0.6,
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=frozenset({"GET", "HEAD"}),
        respect_retry_after_header=True,
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retry, pool_connections=WORKERS, pool_maxsize=WORKERS)
    session = requests.Session()
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    session.headers.update(
        {
            "User-Agent": USER_AGENT,
            "Accept-Language": "en-GB,en;q=0.9",
            "Accept": "text/html,application/xml,text/xml,application/xhtml+xml,*/*;q=0.8",
        }
    )
    return session


def get(url: str) -> bytes:
    """Fetch a URL with bounded retries, timeouts, and per-thread sessions."""
    session = getattr(_thread_local, "session", None)
    if session is None:
        session = _new_session()
        _thread_local.session = session
    response = session.get(url, timeout=(10, TIMEOUT), allow_redirects=True)
    if not _is_asda_url(response.url):
        raise CatalogueRefreshError(f"ASDA URL redirected off the official domain: {url}")
    if "/groceries/product/" in urlsplit(url).path.lower() and "/groceries/product/" not in urlsplit(response.url).path.lower():
        raise CatalogueRefreshError(f"ASDA product URL redirected away from a product page: {url}")
    response.raise_for_status()
    return response.content


def _is_asda_url(url: str) -> bool:
    try:
        parsed = urlsplit(url)
    except ValueError:
        return False
    return parsed.scheme == "https" and (parsed.hostname or "").lower() in {"asda.com", "www.asda.com"}


def _canonical_url(url: str) -> str:
    parsed = urlsplit(url.strip())
    if not _is_asda_url(url):
        raise CatalogueRefreshError(f"Non-ASDA URL found in sitemap: {url}")
    path = parsed.path or "/"
    return urlunsplit(("https", (parsed.hostname or "www.asda.com").lower(), path, "", ""))


def xml_locs(content: bytes) -> list[str]:
    if content[:2] == b"\x1f\x8b":
        content = gzip.decompress(content)
    root = ET.fromstring(content)
    return [
        element.text.strip()
        for element in root.iter()
        if element.tag.rsplit("}", 1)[-1].lower() == "loc" and element.text and element.text.strip()
    ]


def _is_sitemap_url(url: str) -> bool:
    path = urlsplit(url).path.lower()
    return path.endswith((".xml", ".xml.gz")) or "sitemap" in Path(path).name


def discover_product_urls() -> tuple[list[str], int]:
    """Recursively follow every sitemap published by ASDA and collect grocery PDPs.

    Sitemap fetch or parse failures abort discovery. Returning an apparently valid
    but incomplete set after skipping a failed child sitemap would risk replacing
    the healthy catalogue with a partial one.
    """
    queue: deque[str] = deque([SITEMAP_INDEX])
    visited: set[str] = set()
    products: set[str] = set()

    while queue:
        sitemap_url = _canonical_url(queue.popleft())
        if sitemap_url in visited:
            continue
        visited.add(sitemap_url)
        try:
            locations = xml_locs(get(sitemap_url))
        except Exception as exc:
            raise CatalogueRefreshError(f"Could not read sitemap {sitemap_url}: {exc}") from exc

        for location in locations:
            if not _is_asda_url(location):
                LOG.warning("Ignoring non-ASDA sitemap location: %s", location)
                continue
            canonical = _canonical_url(location)
            path = urlsplit(canonical).path.lower()
            if "/groceries/product/" in path:
                products.add(canonical)
            elif _is_sitemap_url(canonical) and canonical not in visited:
                queue.append(canonical)

    if not products:
        raise CatalogueRefreshError("ASDA's sitemap tree contained no /groceries/product/ URLs.")
    return sorted(products), len(visited)


def walk_jsonld(value: Any):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from walk_jsonld(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk_jsonld(child)


def _schema_objects(soup: BeautifulSoup) -> list[dict[str, Any]]:
    objects: list[dict[str, Any]] = []
    for script in soup.select('script[type="application/ld+json"]'):
        raw = script.string or script.get_text()
        if not raw:
            continue
        try:
            objects.extend(item for item in walk_jsonld(json.loads(raw)) if isinstance(item, dict))
        except (json.JSONDecodeError, TypeError):
            LOG.debug("Ignoring malformed JSON-LD block")
    return objects


def _is_product_object(value: dict[str, Any]) -> bool:
    kind = value.get("@type", [])
    kinds = kind if isinstance(kind, list) else [kind]
    return "Product" in kinds or ("offers" in value and bool(value.get("name")))


def _meta(soup: BeautifulSoup, *selectors: str) -> str | None:
    for selector in selectors:
        node = soup.select_one(selector)
        if node:
            value = node.get("content") or node.get_text(" ", strip=True)
            if value:
                return str(value).strip()
    return None


def _first_offer(product: dict[str, Any]) -> dict[str, Any]:
    offers = product.get("offers")
    if isinstance(offers, list):
        offers = next((offer for offer in offers if isinstance(offer, dict)), {})
    return offers if isinstance(offers, dict) else {}


def _price_value(value: Any) -> float | None:
    if value is None:
        return None
    match = re.search(r"\d+(?:[.,]\d{1,2})?", str(value).replace(",", ""))
    if not match:
        return None
    try:
        price = float(match.group(0))
        return price if price >= 0 else None
    except ValueError:
        return None


def parse_quantity(value: Any) -> tuple[float | None, str | None]:
    if value is None:
        return None, None
    text = str(value).strip().lower().replace(",", "").replace("×", "x")
    units = r"kg|kilograms?|g|grams?|l|litres?|liters?|ml|millilitres?|milliliters?|cl"
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
            pieces = re.search(r"(\d+)\s*(?:pieces?|each|pack|pk|count|ct)\b", text)
            if pieces:
                return float(pieces.group(1)), "pieces"
            return None, None

    if unit in {"kg", "kilogram", "kilograms"}:
        return quantity * 1000, "g"
    if unit in {"l", "litre", "litres", "liter", "liters"}:
        return quantity * 1000, "ml"
    if unit == "cl":
        return quantity * 10, "ml"
    if unit in {"gram", "grams"}:
        unit = "g"
    if unit in {"millilitre", "millilitres", "milliliter", "milliliters"}:
        unit = "ml"
    return quantity, unit


def _pack_text(soup: BeautifulSoup, product: dict[str, Any], text: str) -> str | None:
    for key in ("weight", "size"):
        value = product.get(key)
        if isinstance(value, dict):
            value = value.get("value") or value.get("name")
        if value:
            return str(value)
    value = _meta(soup, 'meta[property="product:weight"]', 'meta[property="product:size"]')
    if value:
        return value
    match = re.search(
        r"net content\s*(?:net content\s*)?(\d+(?:[.,]\d+)?\s*(?:kg|kilograms?|g|grams?|l|litres?|liters?|ml|millilitres?|milliliters?|cl|pieces?|each|pack|pk|count|ct))\b",
        text,
        re.IGNORECASE,
    )
    if match:
        return match.group(1)
    # ASDA's product title commonly carries the customer-facing pack size.
    match = re.search(
        r"(\d+\s*x\s*\d+(?:[.,]\d+)?\s*(?:kg|g|l|ml|cl)|\d+(?:[.,]\d+)?\s*(?:kg|g|l|ml|cl)|\d+\s*(?:pieces?|each|pack|pk|count|ct))\b",
        text[:1200],
        re.IGNORECASE,
    )
    return match.group(1) if match else None


def _nutrition_from_schema(product: dict[str, Any]) -> dict[str, Any] | None:
    nutrition = product.get("nutrition")
    if not isinstance(nutrition, dict):
        return None
    aliases = {
        "energyKcal": ("calories", "energyKcal"),
        "energyKj": ("energy", "energyKj"),
        "protein": ("proteinContent", "protein"),
        "fat": ("fatContent", "fat"),
        "saturates": ("saturatedFatContent", "saturatedFat", "saturates"),
        "carbohydrate": ("carbohydrateContent", "carbohydrate"),
        "sugars": ("sugarContent", "sugars", "sugar"),
        "fibre": ("fiberContent", "fibreContent", "fiber", "fibre"),
        "salt": ("saltContent", "salt"),
        "sodium": ("sodiumContent", "sodium"),
    }
    result: dict[str, Any] = {}
    for target, keys in aliases.items():
        for key in keys:
            if nutrition.get(key) is not None:
                result[target] = nutrition[key]
                break
    return result or None


def _nutrition_from_tables(soup: BeautifulSoup) -> dict[str, str] | None:
    patterns = {
        "energyKcal": re.compile(r"^energy\s*kcal$", re.I),
        "energyKj": re.compile(r"^energy\s*kJ$", re.I),
        "fat": re.compile(r"^fat$", re.I),
        "saturates": re.compile(r"saturates|saturated fat", re.I),
        "carbohydrate": re.compile(r"^carbohydrate$", re.I),
        "sugars": re.compile(r"sugars?", re.I),
        "fibre": re.compile(r"fibre|fiber", re.I),
        "protein": re.compile(r"^protein$", re.I),
        "salt": re.compile(r"^salt$", re.I),
        "sodium": re.compile(r"^sodium$", re.I),
    }
    values: dict[str, str] = {}
    for row in soup.find_all("tr"):
        cells = row.find_all(["th", "td"])
        if len(cells) < 2:
            continue
        label = re.sub(r"\s+", " ", cells[0].get_text(" ", strip=True)).strip(" :")
        value = re.sub(r"\s+", " ", cells[1].get_text(" ", strip=True))
        for key, pattern in patterns.items():
            if pattern.search(label) and value:
                values[key] = value
                break
    return values or None


def _availability(product: dict[str, Any], offers: dict[str, Any], text: str) -> tuple[str, bool | None]:
    raw = str(offers.get("availability") or product.get("availability") or "").lower()
    if "outofstock" in raw or "out of stock" in raw:
        return "out_of_stock", False
    if "instock" in raw or "in stock" in raw:
        return "in_stock", True
    if "preorder" in raw or "pre-order" in raw:
        return "preorder", False
    lower_text = text.lower()
    if re.search(r"\b(out of stock|currently unavailable|not available online)\b", lower_text):
        return "out_of_stock", False
    return "unknown", None


def _product_name(soup: BeautifulSoup, product: dict[str, Any]) -> str:
    h1 = soup.find("h1")
    return str((h1.get_text(" ", strip=True) if h1 else "") or product.get("name") or _meta(soup, 'meta[property="og:title"]') or "").strip()


def parse_product(url: str, content: bytes | str, checked_at: str | None = None) -> dict[str, Any] | None:
    """Extract a product record from an official ASDA product page."""
    canonical = _canonical_url(url)
    html = content.decode("utf-8", errors="replace") if isinstance(content, bytes) else content
    soup = BeautifulSoup(html, "html.parser")
    objects = _schema_objects(soup)
    product = next((obj for obj in objects if _is_product_object(obj)), {})
    offers = _first_offer(product)
    name = _product_name(soup, product)
    if not name or re.search(r"(page not found|404|access denied|verify you are human)", name, re.I):
        return None

    text = soup.get_text(" ", strip=True)
    price: float | None = None
    currency = str(offers.get("priceCurrency", "GBP")).upper()
    if currency == "GBP":
        price = _price_value(offers.get("price") or offers.get("lowPrice"))
    price_meta = _meta(soup, 'meta[property="product:price:amount"]', 'meta[itemprop="price"]')
    if price is None and price_meta and str(_meta(soup, 'meta[property="product:price:currency"]') or "GBP").upper() == "GBP":
        price = _price_value(price_meta)
    if price is None:
        match = re.search(r"actual price\s*£\s*(\d+(?:\.\d{1,2})?)", text, re.I)
        if match:
            price = float(match.group(1))
    if price is None:
        match = re.search(r"£\s*(\d+(?:\.\d{1,2})?)", text)
        if match:
            price = float(match.group(1))

    pack_size = _pack_text(soup, product, text)
    quantity, unit = parse_quantity(pack_size)
    brand = product.get("brand")
    if isinstance(brand, dict):
        brand = brand.get("name")
    brand = brand or _meta(soup, 'meta[property="product:brand"]', '[itemprop="brand"]')

    image = product.get("image")
    if isinstance(image, list):
        image = next((item for item in image if item), None)
    if isinstance(image, dict):
        image = image.get("url") or image.get("contentUrl")
    image = image or _meta(soup, 'meta[property="og:image"]', 'meta[itemprop="image"]')

    path_parts = [part for part in urlsplit(canonical).path.split("/") if part]
    route_code = path_parts[-1] if path_parts else ""
    sku = product.get("sku") or (route_code if re.fullmatch(r"\d{5,}", route_code) else None)
    gtin = next((product.get(key) for key in ("gtin14", "gtin13", "gtin12", "gtin8", "gtin") if product.get(key)), None)
    category = product.get("category") or _meta(soup, 'meta[property="product:category"]')
    if isinstance(category, list):
        category = " > ".join(str(value) for value in category if value)
    if not category:
        crumbs = [item.get_text(" ", strip=True) for item in soup.select('nav[aria-label*="breadcrumb" i] a, [aria-label*="breadcrumb" i] a')]
        category = " > ".join(item for item in crumbs if item and item.lower() not in {"home", "groceries"}) or (path_parts[2] if len(path_parts) > 2 else None)

    availability, available = _availability(product, offers, text)
    nutrition = _nutrition_from_schema(product) or _nutrition_from_tables(soup)
    ingredients = None
    for node in soup.find_all(string=re.compile(r"^\s*ingredients\s*$", re.I)):
        parent = node.parent
        sibling = parent.find_next_sibling() if parent else None
        if sibling:
            ingredients = sibling.get_text(" ", strip=True) or None
            if ingredients:
                break

    checked = checked_at or datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    stable_code = str(gtin or sku or hashlib.sha256(canonical.encode("utf-8")).hexdigest()[:16])
    identifier = f"asda-{stable_code}"
    return {
        "id": identifier,
        "ingredient": name.lower(),
        "name": name,
        "brand": str(brand).strip() if brand else None,
        "packSize": pack_size,
        "packQuantity": quantity,
        "packUnit": unit,
        "price": price,
        "pricePerBaseUnit": round(price / quantity, 6) if price is not None and quantity else None,
        "url": canonical,
        "image": image,
        "category": category,
        "sku": str(sku) if sku else None,
        "gtin": str(gtin) if gtin else None,
        "availability": availability,
        "available": available,
        "nutrition": nutrition,
        "ingredients": ingredients,
        "retailer": "ASDA",
        "checked": checked[:10],
        "checkedAt": checked,
        "source": "asda_official_sitemap_product_page",
    }


def fetch_product(url: str) -> dict[str, Any] | None:
    return parse_product(url, get(url))


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
        and len(products) == metadata.get("products_saved")
    ):
        return len(products)
    return 0


def validate_catalogue(
    products: list[dict[str, Any]],
    discovered_urls: list[str],
    failures: list[tuple[str, str]],
    previous_count: int = 0,
    minimum_products: int = MIN_CATALOGUE_PRODUCTS,
) -> None:
    if failures:
        sample = "; ".join(f"{url}: {error}" for url, error in failures[:8])
        raise CatalogueRefreshError(
            f"Incomplete scrape: {len(failures)}/{len(discovered_urls)} product pages failed or could not be parsed. {sample}"
        )
    if len(discovered_urls) < minimum_products or len(products) < minimum_products:
        raise CatalogueRefreshError(
            f"Catalogue validation rejected {len(products)} products from {len(discovered_urls)} URLs; "
            f"at least {minimum_products} are required."
        )
    if len(products) != len(discovered_urls):
        raise CatalogueRefreshError(
            f"Incomplete scrape: parsed {len(products)} of {len(discovered_urls)} discovered product URLs."
        )
    ids = [product.get("id") for product in products]
    urls = [product.get("url") for product in products]
    if any(not value for value in ids) or len(set(ids)) != len(ids):
        raise CatalogueRefreshError("Catalogue contains missing or duplicate stable product IDs.")
    if any(not value for value in urls) or len(set(urls)) != len(urls):
        raise CatalogueRefreshError("Catalogue contains missing or duplicate product URLs.")
    for product in products:
        if not _is_asda_url(str(product.get("url", ""))) or "/groceries/product/" not in urlsplit(str(product.get("url"))).path.lower():
            raise CatalogueRefreshError(f"Catalogue contains a non-product or non-ASDA URL: {product.get('url')}")
        if not str(product.get("name", "")).strip():
            raise CatalogueRefreshError(f"Catalogue contains a product without a name: {product.get('url')}")
        price = product.get("price")
        if price is not None and (not isinstance(price, (int, float)) or price < 0):
            raise CatalogueRefreshError(f"Catalogue contains an invalid price: {product.get('url')}")
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
            json.dump(value, handle, ensure_ascii=False, indent=2)
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
    discover_fn: Callable[[], tuple[list[str], int]] | None = None,
    fetch_fn: Callable[[str], dict[str, Any] | None] | None = None,
) -> list[dict[str, Any]]:
    products_path = Path(output_path or os.environ.get("PRODUCT_OUT", str(DEFAULT_PRODUCTS_PATH))).resolve()
    meta_path = Path(metadata_path or products_path.with_name("catalogue-meta.json")).resolve()
    discovered, sitemap_count = (discover_fn or discover_product_urls)()
    urls = sorted(set(discovered))
    if not urls:
        raise CatalogueRefreshError("ASDA sitemap discovery returned no product URLs.")

    previous_count = _healthy_previous_count(products_path, meta_path)
    LOG.info("Discovered %d product URLs across %d sitemaps; fetching with %d workers", len(urls), sitemap_count, WORKERS)
    started = time.monotonic()
    records: list[dict[str, Any]] = []
    failures: list[tuple[str, str]] = []
    worker = fetch_fn or fetch_product
    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futures = {pool.submit(worker, url): url for url in urls}
        for processed, future in enumerate(as_completed(futures), start=1):
            url = futures[future]
            try:
                product = future.result()
                if product is None:
                    failures.append((url, "page did not contain a parseable product name"))
                else:
                    records.append(product)
            except Exception as exc:
                failures.append((url, str(exc)[:500]))
            if processed % 250 == 0:
                LOG.info("Processed %d/%d pages; parsed %d", processed, len(urls), len(records))

    records.sort(key=lambda product: str(product.get("name", "")).casefold())
    ids: dict[str, int] = {}
    for product in records:
        ids[product["id"]] = ids.get(product["id"], 0) + 1
    for product in records:
        if ids[product["id"]] > 1:
            suffix = hashlib.sha256(product["url"].encode("utf-8")).hexdigest()[:8]
            product["id"] = f"{product['id']}-{suffix}"
    validate_catalogue(records, urls, failures, previous_count=previous_count)

    completed_at = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    elapsed = round(time.monotonic() - started, 2)
    metadata = {
        "schema_version": 2,
        "status": "complete",
        "source": "ASDA official sitemap and official product pages",
        "sitemap_index": SITEMAP_INDEX,
        "refreshed_at": completed_at,
        "last_successful_at": completed_at,
        "duration_seconds": elapsed,
        "discovered_sitemaps": sitemap_count,
        "discovered_urls": len(urls),
        "pages_fetched": len(urls),
        "products_saved": len(records),
        "product_page_failures": 0,
        "coverage": 1.0,
        "with_price": sum(product.get("price") is not None for product in records),
        "with_pack_size": sum(product.get("packSize") is not None for product in records),
        "with_sku": sum(product.get("sku") is not None for product in records),
        "with_gtin": sum(product.get("gtin") is not None for product in records),
        "with_brand": sum(product.get("brand") is not None for product in records),
        "with_category": sum(product.get("category") is not None for product in records),
        "with_availability": sum(product.get("availability") != "unknown" for product in records),
        "with_image": sum(product.get("image") is not None for product in records),
        "with_nutrition": sum(product.get("nutrition") is not None for product in records),
    }

    # Both files are staged only after all pages and validation succeed. Products
    # are atomically replaced first; metadata acts as the published snapshot marker.
    _atomic_json(products_path, records)
    _atomic_json(meta_path, metadata)
    LOG.info("Published %d validated products in %.2fs", len(records), elapsed)
    return records


def read_catalogue_status(products_path: str | Path | None = None, metadata_path: str | Path | None = None) -> dict[str, Any]:
    product_file = Path(products_path or os.environ.get("PRODUCT_OUT", str(DEFAULT_PRODUCTS_PATH))).resolve()
    meta_file = Path(metadata_path or product_file.with_name("catalogue-meta.json")).resolve()
    metadata = _read_json(meta_file)
    products = _read_json(product_file)
    if not isinstance(metadata, dict):
        metadata = {"status": "unavailable", "source": "ASDA official sitemap and official product pages"}
    metadata = dict(metadata)
    recorded_count = metadata.get("products_saved")
    actual_count = len(products) if isinstance(products, list) else 0
    metadata["products_saved"] = actual_count
    metadata["healthy"] = metadata.get("status") == "complete" and isinstance(products, list) and actual_count == recorded_count
    return metadata
