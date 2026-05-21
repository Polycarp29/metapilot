#!/bin/bash
cd "/home/z3uxie/Desktop/MyProjects/analytics-engine"
source venv/bin/activate
# 1. Start the FastAPI engine on port 8001
nohup venv/bin/uvicorn main:app --host 127.0.0.1 --port 8001 > uvicorn.log 2>&1 &
echo "FastAPI Analytics Engine started in background on port 8001."

# 2. Start the GA4/GSC Analytics worker
nohup python3 worker.py > worker.log 2>&1 &
echo "GA4/GSC Analytics Worker started in background."

# 3. Start Laravel queue worker for CDN ingestion and other queues
cd "/home/z3uxie/Desktop/MyProjects/Json_ld manager"
nohup php artisan queue:work redis --queue=cdn-ingestion,cdn,emails,gsc,predictive,default --sleep=3 --tries=3 > storage/logs/worker.log 2>&1 &
echo "Laravel Queue Worker started in background, listening to 'cdn-ingestion,cdn,emails,gsc,predictive,default'..."
