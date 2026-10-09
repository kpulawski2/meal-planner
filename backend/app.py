"""Small HTTP service exposing the validated ASDA catalogue refresh."""

from __future__ import annotations

import logging
import os

from flask import Flask, jsonify

from asda_catalogue import CatalogueRefreshError, crawl, read_catalogue_status

app = Flask(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")


@app.get("/health")
def health():
    status = read_catalogue_status()
    return jsonify({"ok": True, "service": "meal-planner-asda-catalogue", "catalogue": status})


@app.get("/catalogue/status")
def catalogue_status():
    return jsonify(read_catalogue_status())


@app.post("/refresh")
def refresh():
    try:
        products = crawl()
    except CatalogueRefreshError as exc:
        logging.exception("ASDA catalogue refresh rejected")
        return jsonify({"ok": False, "error": str(exc), "catalogue": read_catalogue_status()}), 502
    return jsonify({"ok": True, "products": len(products), "catalogue": read_catalogue_status()})


@app.get("/products")
def products():
    try:
        import json
        from pathlib import Path

        path = Path(os.environ.get("PRODUCT_OUT", str(Path(__file__).resolve().parents[1] / "data" / "products.json")))
        return jsonify(json.loads(path.read_text(encoding="utf-8")))
    except (OSError, ValueError):
        return jsonify({"error": "Catalogue is not available yet."}), 503


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "10000")))
