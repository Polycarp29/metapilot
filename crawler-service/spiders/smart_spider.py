import scrapy
from scrapy_playwright.page import PageMethod
import json
import redis
import os

class SmartSpider(scrapy.Spider):
    name = 'smart_spider'

    def __init__(self, job_id, url, max_depth=3, options=None, *args, **kwargs):
        super(SmartSpider, self).__init__(*args, **kwargs)
        self.job_id = job_id
        self.start_urls = [url]
        self.max_depth = int(max_depth)
        self.options = options or {}
        
        # Redis for results
        self.r = redis.Redis(
            host=os.getenv('REDIS_HOST', '127.0.0.1'),
            port=os.getenv('REDIS_PORT', 6379),
            db=os.getenv('REDIS_DB', 0),
            decode_responses=True
        )

    def start_requests(self):
        for url in self.start_urls:
            yield scrapy.Request(
                url, 
                callback=self.parse,
                meta={
                    'playwright': self.options.get('render_js', False),
                    'depth': 0
                }
            )

    def parse(self, response):
        depth = response.meta.get('depth', 0)
        
        # 1. Extract Metadata
        data = {
            'title': response.css('title::text').get(),
            'meta': {
                'description': response.xpath('//meta[@name="description"]/@content').get(),
                'canonical': response.xpath('//link[@rel="canonical"]/@href').get(),
            },
            'content': {
                'h1': response.css('h1::text').get(),
                'keywords': [] # To be implemented with NLP
            },
            'schema_suggestions': [], # To be implemented with Semantic Analysis
            'metrics': {
                'load_time': response.meta.get('download_latency', 0)
            }
        }

        # 2. Push Result to Redis
        self.r.rpush('crawler:results', json.dumps({
            'job_id': self.job_id,
            'url': response.url,
            'data': data,
            'status': 'completed'
        }))

        # 3. Follow Links (if depth < max_depth)
        if depth < self.max_depth:
            for next_page in response.css('a::attr(href)').getall():
                if next_page.startswith('/'):
                    next_page = response.urljoin(next_page)
                
                if next_page.startswith(self.start_urls[0]): # Only internal links
                    yield response.follow(next_page, self.parse, meta={'depth': depth + 1, 'playwright': self.options.get('render_js', False)})
