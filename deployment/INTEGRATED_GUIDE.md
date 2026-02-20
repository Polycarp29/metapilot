# Integrated Production Deployment Guide

Since your Laravel project and Python Crawler service are in separate folders, follow this guide to set them up and ensure they communicate correctly in production.

## 1. Directory Structure
Assume the following paths on your server:
- **Laravel**: `/var/www/metapilot`
- **Crawler Service**: `/var/www/crawler`

## 2. Setting Up the Python Crawler Service
1.  **Move the folder**: Upload `crawler-service` to `/var/www/crawler`.
2.  **Run Setup**:
    ```bash
    cd /var/www/crawler
    chmod +x setup_crawler_production.sh
    # Install full dependencies
    /var/www/crawler/.venv/bin/python -m pip install scrapy scrapy-playwright redis beautifulsoup4 rake-nltk spacy pydantic python-dotenv flask flask-restful flask-cors requests gunicorn eventlet
    ```
3.  **Configure `.env`**: Create a `.env` in `/var/www/crawler`:
    ```env
    REDIS_HOST=127.0.0.1
    REDIS_PORT=6379
    REDIS_PREFIX=metapilot-database-
    CRAWLER_PORT=5000
    CRAWLER_WEBHOOK_SECRET=your_secret_here
    ```

## 3. Configuring Laravel
1.  **Update `.env`**: Ensure Laravel knows where the crawler is:
    ```env
    CRAWLER_SERVICE_URL=http://localhost:5000
    REDIS_HOST=127.0.0.1
    ```

## 4. Process Management (Supervisor)
Supervisor ensures all your processes stay alive.

1.  **Install Supervisor**: `sudo apt install supervisor`
2.  **Copy Configs**: Move the three `.conf` files I generated to `/etc/supervisor/conf.d/`:
    - `laravel-worker.conf` -> Manages Laravel Jobs
    - `crawler-consumer.conf` -> Manages Crawler Result Processing
    - `crawler-api.conf` -> Manages the Python Flask API
3.  **Update Paths**: Edit the `.conf` files to ensure they point to `/var/www/metapilot` and `/var/www/crawler` respectively.
4.  **Activate**:
    ```bash
    sudo supervisorctl reread
    sudo supervisorctl update
    sudo supervisorctl status
    ```

## 5. Network & Security (Nginx)
- **Laravel**: Your existing Nginx config should handle the Laravel bit.
- **Python API**: Since it's on port `5000`, it's recommended to keep it blocked from the public. Laravel talks to it via `localhost:5000`, so no extra Nginx config is needed unless you want to access the crawler status from a separate domain.

## 6. Testing the Connection
- Run `curl http://localhost:5000/health`. It should return `{"status": "healthy"}`.
- Trigger a crawl in Laravel. Monitor logs:
    - Laravel: `tail -f storage/logs/laravel.log`
    - Crawler: `tail -f ../crawler-service/logs/api.log`
