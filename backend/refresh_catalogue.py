"""Refresh the ASDA catalogue from the repository root or backend directory."""

try:
    from .asda_catalogue import crawl
except ImportError:  # Running as ``python backend/refresh_catalogue.py``.
    from asda_catalogue import crawl

if __name__ == '__main__':
    data = crawl()
    print(f'Published validated ASDA catalogue: {len(data)} products')
