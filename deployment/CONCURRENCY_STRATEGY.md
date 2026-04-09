# Pique AI — Concurrency & Scalability Strategy

This document outlines how the system handles multiple simultaneous AI requests across the frontend, backend, and infrastructure layers.

---

## 1. UI Layer (Frontend)

- **Typing Guard:** The `sendMessage` function in `Index.vue` uses an `isTyping` flag. This prevents a single user from sending another prompt while the current one is still being processed.
- **Action Blocking:** During report generation or crawling, the UI transitions into a specific step (e.g., "Compiling..." or a progress bar), naturally guiding the user to wait for the result before starting new complex actions.

## 2. API Layer (Backend Throttling)

- **Rate Limiting:** We use Laravel's `RateLimiter` to protect the AI endpoints from abuse and API exhaustion.
    - **Chat (`pique-chat`):** Capped at **20 requests per minute** per user/IP.
    - **Reports (`pique-reports`):** Capped at **5 requests per minute** per user/IP.
- **Concurrent Requests:** The server (Nginx + PHP-FPM) handles multiple users in parallel. Each request to `/api/pique/ask` runs in its own process.

## 3. Worker Layer (SEO Reports & Crawling)

- **Asynchronous Jobs:** Large data tasks (like PDF generation) are moved to the Laravel Queue.
- **Horizontal Scaling:** To handle hundreds of simultaneous report requests:
    - Increase the `numprocs` in `deployment/pique-worker.conf`.
    - Add more server instances to your queue worker pool.
- **Data Capping:** The `GenerateSeoReportJob` caps datasets (e.g., top 15 channels only) to ensure workers don't run out of memory (OOM) when multiple large reports are processed at once.

## 4. LLM Provider Layer (External)

- **Provider Limits:** Providers like OpenAI and Claude have their own rate limits (RPM/TPM).
- **Error Handling:** If an LLM provider returns a 429 (Too Many Requests), Pique is designed to handle this gracefully (logging the error and informing the user).

---

## Scaling Suggestions for High Traffic

1. **Redis:** Use Redis for your Cache and Queue drivers to ensure fast throughput for polling and job management.
2. **Dedicated Workers:** Run Pique queue workers on separate servers from the main web application to ensure report generation doesn't slow down the site.
3. **Queue Priorities:** Consider using a high-priority queue for chat interactions and a lower-priority one for large reports.
