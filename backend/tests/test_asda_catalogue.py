import gzip
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import asda_catalogue as catalogue


def product_record(index):
    sku = str(7000000 + index)
    return {
        "id": f"asda-{sku}",
        "ingredient": f"product {index}",
        "name": f"ASDA Grocery Product {index}",
        "brand": "ASDA",
        "packSize": "500 g",
        "packQuantity": 500,
        "packUnit": "g",
        "price": 1.25,
        "pricePerBaseUnit": 0.0025,
        "url": f"https://www.asda.com/groceries/product/grocery/{sku}",
        "image": None,
        "category": "Food cupboard",
        "sku": sku,
        "gtin": None,
        "availability": "unknown",
        "available": None,
        "nutrition": None,
        "ingredients": None,
        "retailer": "ASDA",
        "checked": "2026-10-07",
        "checkedAt": "2026-10-07T06:00:00Z",
        "source": "asda_official_sitemap_product_page",
    }


class XmlAndProductParsingTests(unittest.TestCase):
    def test_xml_locs_supports_namespaces_and_gzip(self):
        xml = b'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://www.asda.com/groceries/product/test/7000001</loc></url></urlset>'
        self.assertEqual(catalogue.xml_locs(gzip.compress(xml)), ["https://www.asda.com/groceries/product/test/7000001"])

    def test_sitemap_discovery_recurses_and_deduplicates_product_urls(self):
        documents = {
            catalogue.SITEMAP_INDEX: b'<sitemapindex><sitemap><loc>https://www.asda.com/nested-index.xml</loc></sitemap><sitemap><loc>https://www.asda.com/products.xml</loc></sitemap></sitemapindex>',
            "https://www.asda.com/nested-index.xml": b'<sitemapindex><sitemap><loc>https://www.asda.com/products.xml</loc></sitemap></sitemapindex>',
            "https://www.asda.com/products.xml": b'<urlset><url><loc>https://www.asda.com/groceries/product/test/7000001</loc></url><url><loc>https://www.asda.com/groceries/product/test/7000002</loc></url><url><loc>https://www.asda.com/groceries/product/test/7000001</loc></url></urlset>',
        }
        with patch.object(catalogue, "get", side_effect=lambda url: documents[url]):
            urls, sitemap_count = catalogue.discover_product_urls()
        self.assertEqual(len(urls), 2)
        self.assertEqual(sitemap_count, 3)

    def test_parse_product_extracts_price_pack_ids_brand_image_and_nutrition(self):
        html = '''<html><head><meta property="og:image" content="https://images.asda.com/beef.jpg"></head><body>
          <h1>ASDA Beef Mince 500g</h1><p>actual priceÂ£5.05</p><p>Net Content</p><p>500 Grams</p>
          <script type="application/ld+json">{"@type":"Product","sku":"5391423","gtin13":"5012345678900","brand":{"name":"ASDA"},"category":"Fresh meat","offers":{"price":"5.05","priceCurrency":"GBP","availability":"https://schema.org/InStock"}}</script>
          <h2>Ingredients</h2><p>Beef (100%)</p><h2>Nutritional Values</h2><table>
          <tr><th>Energy kcal</th><td>132</td></tr><tr><th>Fat</th><td>4.8g</td></tr><tr><th>of which saturates</th><td>2.1g</td></tr>
          <tr><th>Carbohydrate</th><td>0g</td></tr><tr><th>of which sugars</th><td>&lt;0.5g</td></tr><tr><th>Fibre</th><td>&lt;0.5g</td></tr><tr><th>Protein</th><td>22g</td></tr><tr><th>Salt</th><td>0.13g</td></tr>
          </table></body></html>'''
        url = "https://www.asda.com/groceries/product/beef/5391423"
        result = catalogue.parse_product(url, html, "2026-10-07T06:00:00Z")
        self.assertEqual(result["id"], "asda-5012345678900")
        self.assertEqual(result["sku"], "5391423")
        self.assertEqual(result["gtin"], "5012345678900")
        self.assertEqual(result["price"], 5.05)
        self.assertEqual(result["packQuantity"], 500)
        self.assertEqual(result["packUnit"], "g")
        self.assertEqual(result["availability"], "in_stock")
        self.assertEqual(result["brand"], "ASDA")
        self.assertEqual(result["category"], "Fresh meat")
        self.assertEqual(result["image"], "https://images.asda.com/beef.jpg")
        self.assertEqual(result["nutrition"]["protein"], "22g")
        self.assertEqual(result["ingredients"], "Beef (100%)")

    def test_quantity_parser_handles_multipacks_and_metric_conversion(self):
        self.assertEqual(catalogue.parse_quantity("24 x 25g"), (600.0, "g"))
        self.assertEqual(catalogue.parse_quantity("2 litres"), (2000.0, "ml"))
        self.assertEqual(catalogue.parse_quantity("6 pieces"), (6.0, "pieces"))

    def test_http_sessions_have_bounded_retry_policy(self):
        session = catalogue._new_session()
        try:
            retry = session.get_adapter("https://").max_retries
            self.assertEqual(retry.total, catalogue.RETRY_TOTAL)
            self.assertIn(429, retry.status_forcelist)
            self.assertIn("GET", retry.allowed_methods)
        finally:
            session.close()


class CataloguePublicationTests(unittest.TestCase):
    def test_complete_catalogue_over_42_products_is_published_with_metadata(self):
        with tempfile.TemporaryDirectory() as directory:
            products_path = Path(directory) / "products.json"
            urls = [product_record(i)["url"] for i in range(130)]
            records = {product_record(i)["url"]: product_record(i) for i in range(130)}
            result = catalogue.crawl(
                output_path=products_path,
                discover_fn=lambda: (urls, 5),
                fetch_fn=lambda url: records[url],
            )
            saved = json.loads(products_path.read_text(encoding="utf-8"))
            metadata = json.loads((Path(directory) / "catalogue-meta.json").read_text(encoding="utf-8"))
            self.assertEqual(len(result), 130)
            self.assertEqual(len(saved), 130)
            self.assertEqual(metadata["status"], "complete")
            self.assertEqual(metadata["discovered_urls"], 130)
            self.assertEqual(metadata["products_saved"], 130)
            self.assertEqual(metadata["coverage"], 1.0)

    def test_failed_page_does_not_replace_healthy_catalogue_or_metadata(self):
        with tempfile.TemporaryDirectory() as directory:
            products_path = Path(directory) / "products.json"
            metadata_path = Path(directory) / "catalogue-meta.json"
            healthy_products = [product_record(i) for i in range(130)]
            healthy_metadata = {"status": "complete", "products_saved": 130, "last_successful_at": "yesterday"}
            products_path.write_text(json.dumps(healthy_products), encoding="utf-8")
            metadata_path.write_text(json.dumps(healthy_metadata), encoding="utf-8")
            before_products = products_path.read_bytes()
            before_metadata = metadata_path.read_bytes()
            urls = [product["url"] for product in healthy_products]

            def fetch(url):
                if url == urls[0]:
                    raise RuntimeError("temporary ASDA error")
                return next(product for product in healthy_products if product["url"] == url)

            with self.assertRaises(catalogue.CatalogueRefreshError):
                catalogue.crawl(
                    output_path=products_path,
                    metadata_path=metadata_path,
                    discover_fn=lambda: (urls, 5),
                    fetch_fn=fetch,
                )
            self.assertEqual(products_path.read_bytes(), before_products)
            self.assertEqual(metadata_path.read_bytes(), before_metadata)

    def test_empty_sitemap_tree_is_rejected(self):
        with patch.object(catalogue, "get", return_value=b"<urlset></urlset>"):
            with self.assertRaises(catalogue.CatalogueRefreshError):
                catalogue.discover_product_urls()


if __name__ == "__main__":
    unittest.main()
