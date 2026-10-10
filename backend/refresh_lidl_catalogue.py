import logging
from lidl_catalogue import refresh

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO,format='%(asctime)s %(levelname)s %(message)s')
    metadata=refresh()
    logging.info('Published %s products; %s have public GBP prices',metadata['products_saved'],metadata['with_price'])
