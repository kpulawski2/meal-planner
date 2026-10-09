import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import asda_catalogue as catalogue

TEST_TMP_ROOT = Path(__file__).resolve().parents[2] / "data"


def hit_record(index):
    sku = str(7000000 + index)
    return {
        "objectID": sku,
        "ID": str(index + 1),
        "CIN": sku,
        "NAME": f"Grocery Product {index}",
        "BRAND": "ASDA",
        "IMAGE_ID": f"image-{index}",
        "PACK_SIZE": "500g",
        "PRICES": {
            "EN": {"OFFER": "List", "PRICE": 1.25, "PRICEPERUOM": 2.5, "PRICEPERUOMFORMATTED": "£2.50/kg"},
            "SC": {"OFFER": "Rollback", "PRICE": 1.1, "PRICEPERUOM": 2.2, "PRICEPERUOMFORMATTED": "£2.20/kg"},
        },
        "PRIMARY_TAXONOMY": {
            "CAT_NAME": "Food Cupboard",
            "DEPT_NAME": "Tinned Food",
            "AISLE_NAME": "Tinned Vegetables",
            "SHELF_NAME": "Sweetcorn",
        },
        "NUTRITIONAL_INFO": {"Vegetarian": 1, "Vegan": 0},
        "LIFESTYLES": ["Suitable for Vegetarians"],
        "STATUS": "A",
        "DISPLAY_ONLINE": True,
        "PRODUCT_TYPE": "STANDARD",
        "SKU_TYPE_IDENTIFIER": "GROCERY",
    }


class SearchIndexConversionTests(unittest.TestCase):
    def test_product_record_has_official_link_regional_price_pack_sku_and_image(self):
        source = {
            "objectID": "970207",
            "ID": "484048",
            "CIN": "970207",
            "NAME": "Luxury Ice Cream Double Jersey 1 Litre",
            "BRAND": "English Lakes",
            "IMAGE_ID": "5021952111106",
            "PACK_SIZE": "1L",
            "PRICES": {
                "EN": {"OFFER": "List", "PRICE": 4, "PRICEPERUOM": 4, "PRICEPERUOMFORMATTED": "£4.00/LT"},
                "NI": {"OFFER": "Rollback", "PRICE": 3.5, "PRICEPERUOM": 3.5},
            },
            "PRIMARY_TAXONOMY": {
                "CAT_NAME": "Frozen Food",
                "DEPT_NAME": "Ice Cream & Ice Lollies",
                "AISLE_NAME": "View All Ice Cream & Ice Lollies",
                "SHELF_NAME": "View All Ice Cream & Ice Lollies",
            },
            "NUTRITIONAL_INFO": {"Vegetarian": 1, "Vegan": 0},
            "LIFESTYLES": ["Gluten free", "Suitable for Vegetarians"],
        }
        result = catalogue.product_from_hit(source, "2026-10-09T05:00:00Z")
        self.assertEqual(result["name"], "English Lakes Luxury Ice Cream Double Jersey 1 Litre")
        self.assertEqual(
            result["url"],
            "https://www.asda.com/groceries/product/view-all-ice-cream-ice-lollies/english-lakes-luxury-ice-cream-double-jersey-1-litre/970207",
        )
        self.assertEqual(result["price"], 4)
        self.assertEqual(result["priceRegion"], "EN")
        self.assertEqual(result["pricesByRegion"]["NI"]["price"], 3.5)
        self.assertEqual(result["packQuantity"], 1000)
        self.assertEqual(result["packUnit"], "ml")
        self.assertEqual(result["sku"], "970207")
        self.assertIsNone(result.get("gtin"))
        self.assertEqual(
            result["image"],
            "https://asdagroceries.scene7.com/is/image/asdagroceries/5021952111106?$ProdListProd$&dpr=on,1",
        )
        self.assertEqual(result["nutritionClaims"], ["Vegetarian", "Gluten free", "Suitable for Vegetarians"])
        self.assertEqual(result["availability"], "listed_online")

    def test_quantity_parser_handles_multipacks_and_non_metric_sizes(self):
        self.assertEqual(catalogue.parse_quantity("24 x 25g"), (600.0, "g"))
        self.assertEqual(catalogue.parse_quantity("2 litres"), (2000.0, "ml"))
        self.assertEqual(catalogue.parse_quantity("2 PINT"), (1136.5225, "ml"))
        self.assertEqual(catalogue.parse_quantity("6 pieces"), (6.0, "pieces"))

    def test_http_sessions_retry_safe_search_posts(self):
        session = catalogue._new_session()
        try:
            retry = session.get_adapter("https://").max_retries
            self.assertEqual(retry.total, catalogue.RETRY_TOTAL)
            self.assertIn(429, retry.status_forcelist)
            self.assertIn("POST", retry.allowed_methods)
        finally:
            session.close()

    def test_large_category_is_split_using_exhaustive_department_facets(self):
        calls = []

        def fake_search(**kwargs):
            calls.append(kwargs)
            return {
                "nbHits": 22000,
                "exhaustiveNbHits": True,
                "facets": {"PRIMARY_TAXONOMY.DEPT_NAME": {"Kitchen": 11000, "Bed, Bath & Home": 11000}},
                "hits": [],
            }

        partitions = catalogue._discover_partitions({"Home & Entertainment": 22000}, fake_search)
        self.assertEqual(sum(count for _, count in partitions), 22000)
        self.assertEqual(len(partitions), 2)
        self.assertEqual(len(calls), 1)
        self.assertTrue(all(count == 11000 for _, count in partitions))


class CataloguePublicationTests(unittest.TestCase):
    def fake_search(self, records, **kwargs):
        facets = kwargs.get("facets") or []
        if "PRIMARY_TAXONOMY.CAT_NAME" in facets:
            return {
                "nbHits": len(records),
                "exhaustiveNbHits": True,
                "facets": {"PRIMARY_TAXONOMY.CAT_NAME": {"Food Cupboard": len(records)}},
                "hits": [],
            }
        page = kwargs.get("page", 0)
        size = kwargs.get("hits_per_page", catalogue.HITS_PER_PAGE)
        start = page * size
        return {"nbHits": len(records), "hits": records[start : start + size]}

    def test_complete_catalogue_over_42_products_is_published_with_metadata(self):
        with tempfile.TemporaryDirectory(dir=TEST_TMP_ROOT) as directory:
            products_path = Path(directory) / "products.json"
            records = [hit_record(i) for i in range(130)]
            result = catalogue.crawl(
                output_path=products_path,
                search_fn=lambda **kwargs: self.fake_search(records, **kwargs),
            )
            saved = json.loads(products_path.read_text(encoding="utf-8"))
            metadata = json.loads((Path(directory) / "catalogue-meta.json").read_text(encoding="utf-8"))
            self.assertEqual(len(result), 130)
            self.assertEqual(len(saved), 130)
            self.assertEqual(metadata["status"], "complete")
            self.assertEqual(metadata["products_expected"], 130)
            self.assertEqual(metadata["products_saved"], 130)
            self.assertEqual(metadata["coverage"], 1.0)
            status = catalogue.read_catalogue_status(products_path, Path(directory) / "catalogue-meta.json")
            self.assertTrue(status["healthy"])
            self.assertEqual(status["products_saved"], 130)

    def test_short_page_does_not_replace_healthy_catalogue_or_metadata(self):
        with tempfile.TemporaryDirectory(dir=TEST_TMP_ROOT) as directory:
            products_path = Path(directory) / "products.json"
            metadata_path = Path(directory) / "catalogue-meta.json"
            healthy_products = [catalogue.product_from_hit(hit_record(i), "2026-10-08T05:00:00Z") for i in range(130)]
            healthy_metadata = {
                "status": "complete", "products_saved": 130, "products_expected": 130,
                "coverage": 1.0, "last_successful_at": "yesterday",
            }
            products_path.write_text(json.dumps(healthy_products), encoding="utf-8")
            metadata_path.write_text(json.dumps(healthy_metadata), encoding="utf-8")
            before_products = products_path.read_bytes()
            before_metadata = metadata_path.read_bytes()
            records = [hit_record(i) for i in range(130)]

            def short_page(**kwargs):
                result = self.fake_search(records, **kwargs)
                if not kwargs.get("facets"):
                    result["hits"] = result["hits"][:40]
                return result

            with self.assertRaises(catalogue.CatalogueRefreshError):
                catalogue.crawl(
                    output_path=products_path,
                    metadata_path=metadata_path,
                    search_fn=short_page,
                )
            self.assertEqual(products_path.read_bytes(), before_products)
            self.assertEqual(metadata_path.read_bytes(), before_metadata)

    def test_drop_below_threshold_does_not_replace_healthy_catalogue(self):
        with tempfile.TemporaryDirectory(dir=TEST_TMP_ROOT) as directory:
            products_path = Path(directory) / "products.json"
            metadata_path = Path(directory) / "catalogue-meta.json"
            healthy_products = [catalogue.product_from_hit(hit_record(i), "2026-10-08T05:00:00Z") for i in range(130)]
            products_path.write_text(json.dumps(healthy_products), encoding="utf-8")
            metadata_path.write_text(json.dumps({
                "status": "complete", "products_saved": 130, "products_expected": 130, "coverage": 1.0,
            }), encoding="utf-8")
            before = products_path.read_bytes()
            small_records = [hit_record(i) for i in range(100)]
            with self.assertRaises(catalogue.CatalogueRefreshError):
                catalogue.crawl(
                    output_path=products_path,
                    metadata_path=metadata_path,
                    search_fn=lambda **kwargs: self.fake_search(small_records, **kwargs),
                )
            self.assertEqual(products_path.read_bytes(), before)

    def test_inexact_category_facets_are_rejected(self):
        with tempfile.TemporaryDirectory(dir=TEST_TMP_ROOT) as directory:
            with self.assertRaises(catalogue.CatalogueRefreshError):
                catalogue.crawl(
                    output_path=Path(directory) / "products.json",
                    search_fn=lambda **kwargs: {
                        "nbHits": 130,
                        "exhaustiveNbHits": False,
                        "facets": {"PRIMARY_TAXONOMY.CAT_NAME": {"Food Cupboard": 130}},
                        "hits": [],
                    },
                )
            self.assertFalse((Path(directory) / "products.json").exists())

    def test_catalogue_change_during_refresh_is_rejected(self):
        with tempfile.TemporaryDirectory(dir=TEST_TMP_ROOT) as directory:
            records = [hit_record(i) for i in range(130)]
            facet_calls = 0

            def changing_search(**kwargs):
                nonlocal facet_calls
                if "PRIMARY_TAXONOMY.CAT_NAME" in (kwargs.get("facets") or []):
                    facet_calls += 1
                    count = 130 if facet_calls == 1 else 129
                    return {
                        "nbHits": count,
                        "exhaustiveNbHits": True,
                        "facets": {"PRIMARY_TAXONOMY.CAT_NAME": {"Food Cupboard": count}},
                        "hits": [],
                    }
                return self.fake_search(records, **kwargs)

            output_path = Path(directory) / "products.json"
            with self.assertRaises(catalogue.CatalogueRefreshError):
                catalogue.crawl(output_path=output_path, search_fn=changing_search)
            self.assertFalse(output_path.exists())


if __name__ == "__main__":
    unittest.main()
