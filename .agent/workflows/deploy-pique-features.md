---
description: How to integrate and deploy Pique's interactive Crawler and SEO Report features to production
---

# Production Integration Guide: Pique Features

Follow these steps to ensure the interactive Crawl Flow and Async SEO PDF Reports work correctly in your production environment.

## 1. Environment Configuration

Ensure your `.env` file contains the correct URL for the crawler microservice:

```bash
CRAWLER_SERVICE_URL=http://your-crawler-ip:5000
```

## 2. Storage Setup

Pique saves PDF reports to `storage/app/public/reports`. You must ensure the public disk is linked so users can download them:
// turbo

```bash
php artisan storage:link
```

## 3. Queue Management (CRITICAL)

The SEO reports are generated as background jobs to prevent timeouts. You **MUST** have a queue worker running:

```bash
# Start the queue worker (use Supervisor in production)
php artisan queue:work --timeout=300
```

> [!IMPORTANT]
> Ensure the worker has sufficient memory (at least 256MB/512MB recommended for `dompdf` processing of large datasets).

## 4. Crawler Microservice

The interactive crawl flow depends on the Python-based crawler.

1.  Deploy the Python crawler service to your server.
2.  Ensure it is accessible by the Laravel app.
3.  Verify the `callback_url` sent in `CrawlerManager` is reachable from the crawler service back to your Laravel API.

## 5. Build Assets

Compile the new Vue components (`Index.vue`) for production:

```bash
npm run build
```

## 6. Verification Checklist

1.  [ ] Visit `/pique` and ask "crawl my site".
2.  [ ] Enter a URL and verify the progress bar starts.
3.  [ ] Ask "generate an seo report".
4.  [ ] Configure and click "Compile".
5.  [ ] Verify the queue processes the job and the "Download PDF" button appears.
