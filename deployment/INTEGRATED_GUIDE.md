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

## 3. Laravel Automation (Scheduler & Queues)

### A. Crontab (Crucial for Scanners)
The scanners (Keywords and Analytics) depend on the Laravel scheduler.
1. Run `crontab -e`
2. Add: `* * * * * cd /var/www/metapilot && php artisan schedule:run >> /dev/null 2>&1`

### B. Supervisor (Background Workers)
Copy configs from `deployment/` to `/etc/supervisor/conf.d/`:

| Config File | Service |
| :--- | :--- |
| `laravel-worker.conf` | Processes Scanners & Job Queues |
| `crawler-consumer.conf` | Processes Crawler Results |
| `crawler-api.conf` | Python Crawler API (Port 5000) |
| `analytics-worker.conf` | Python Analytics Worker |

**Command to start everything:**
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start all
```

## 5. Network & Security (Nginx)
- **Laravel**: Your existing Nginx config should handle the Laravel bit.
- **Python API**: Since it's on port `5000`, it's recommended to keep it blocked from the public. Laravel talks to it via `localhost:5000`, so no extra Nginx config is needed unless you want to access the crawler status from a separate domain.

## 6. Testing the Connection
- Run `curl http://localhost:5000/health`. It should return `{"status": "healthy"}`.
- Trigger a crawl in Laravel. Monitor logs:
- Laravel: `tail -f storage/logs/laravel.log`
- Analytics Engine: `tail -f /var/www/analytics-engine/engine.log`
- Analytics Worker: `tail -f /var/www/analytics-engine/worker.log`
