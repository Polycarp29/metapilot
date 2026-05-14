# Integrated Production Deployment Guide

This guide covers setting up the Laravel project, Python Crawler, and the new **Analytics Engine** on your production server.

## 1. Directory Structure
Identify your project paths (standard example):
- **Laravel**: `/var/www/metapilot`
- **Crawler Service**: `/var/www/crawler`
- **Analytics Engine**: `/var/www/analytics-engine`

## 2. Python Services Setup

### A. Crawler Service
1.  **Setup**:
    ```bash
    cd /var/www/crawler
    chmod +x setup_crawler_production.sh
    ./setup_crawler_production.sh
    ```

### B. Analytics Engine
1.  **Setup Environment**:
    ```bash
    cd /var/www/analytics-engine
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    ```
2.  **Configure `.env`**:
    Ensure `REDIS_HOST`, `APP_URL` (pointing to Laravel), and `REDIS_PREFIX` match your Laravel settings.

## 4. CDN Ingestion Pipeline (High-Scale)

The CDN tracking system now uses an asynchronous **"Fast Buffer"** architecture to handle millions of hits without crashing the database.

### A. Environment Configuration
Ensure your `.env` supports Redis and higher limits:
```env
QUEUE_CONNECTION=redis
CDN_MAX_DAILY_HITS=1000000
CDN_TOKEN_RATE_LIMIT_RPM=300
```

### B. Supervisor Setup (Crucial)
You must run dedicated workers for the `cdn-ingestion` queue to prevent lag.

**Config: `/etc/supervisor/conf.d/cdn-worker.conf`**
```ini
[program:cdn-worker]
command=php /var/www/metapilot/artisan queue:work --queue=cdn-ingestion --sleep=1 --tries=3
numprocs=4
autostart=true
autorestart=true
user=www-data
```

### C. Health & Monitoring
Monitor the ingestion pipeline in real-time:
- **Status Command**: `php artisan cdn:status` (Shows queue lag, throughput, and bot ratios)
- **Purge Command**: `php artisan cdn:purge-garbage` (Run via CRON to clean up bot data)

## 5. Network & Security (Nginx)
- **Laravel**: Your existing Nginx config should handle the Laravel bit.
- **Python API**: Since it's on port `5000`, it's recommended to keep it blocked from the public. Laravel talks to it via `localhost:5000`.

## 6. Testing the Connection
- Run `curl http://localhost:5000/health`.
- Trigger a pixel hit. Monitor the queue: `php artisan cdn:status`.
- Monitor logs:
    - Laravel: `tail -f storage/logs/laravel.log`
    - CDN Worker: `tail -f storage/logs/cdn-worker.log`
