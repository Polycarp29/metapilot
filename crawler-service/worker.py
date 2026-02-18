import os
import json
import redis
import logging
from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings
from spiders.smart_spider import SmartSpider
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Redis Configuration
REDIS_HOST = os.getenv('REDIS_HOST', '127.0.0.1')
REDIS_PORT = os.getenv('REDIS_PORT', 6379)
REDIS_DB = os.getenv('REDIS_DB', 0)
JOB_QUEUE = 'crawler:jobs'
RESULT_QUEUE = 'crawler:results'

r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB, decode_responses=True)

def process_job(job_data):
    """
    Triggers the Scrapy crawler for a given job.
    """
    logger.info(f"Processing job: {job_data['id']} for URL: {job_data['starting_url']}")
    
    process = CrawlerProcess(get_project_settings())
    process.crawl(SmartSpider, 
                  job_id=job_data['id'], 
                  url=job_data['starting_url'], 
                  max_depth=job_data.get('max_depth', 3),
                  options=job_data.get('options', {}))
    process.start() # This blocks until the crawl is finished

def main():
    logger.info("Worker started, listening for jobs...")
    while True:
        # BLPOP blocks until a job is available
        _, message = r.blpop(JOB_QUEUE)
        try:
            job_data = json.loads(message)
            process_job(job_data)
        except Exception as e:
            logger.error(f"Error processing job: {e}")

if __name__ == "__main__":
    main()
