# Redis Production Configuration Guide

For the web crawler's performance and stability, we recommend the following Redis settings in production:

## 1. Persistence
Ensure Redis is configured to persist data, especially if you have long-running crawl queues.
- Use **RDB** or **AOF** (Append Only File). AOF is generally safer for queues.
- Location: typically `/etc/redis/redis.conf`

```conf
appendonly yes
appendfsync everysec
```

## 2. Memory Management
If you are crawling large sites, Redis memory usage can spike.
- Set a reasonable `maxmemory` limit based on your server RAM.
- Use `allkeys-lru` or `noeviction` (if you want to ensure no jobs are lost).

```conf
maxmemory 512mb
maxmemory-policy noeviction
```

## 3. Security
- Ensure Redis is **NOT** exposed to the public internet (bind to `127.0.0.1`).
- Set a strong password.

```conf
bind 127.0.0.1
requirepass your_strong_password
```

## 4. Environment Configuration
Update your `.env` files for both Laravel and the crawler service:

**Laravel (.env):**
```env
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=your_strong_password
REDIS_PORT=6379
```

**Python Crawler Service (.env):**
```env
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=your_strong_password
```
