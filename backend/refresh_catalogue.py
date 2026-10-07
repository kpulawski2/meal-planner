from app import crawl

if __name__ == '__main__':
    data = crawl()
    print(f'Refreshed ASDA catalogue: {len(data)} products')
