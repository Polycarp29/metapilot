#!/bin/bash

# Metapilot Crawler Zombie/Orphan Cleanup Script
# This script identifies and kills lingering Chromium/Gunicorn processes.

echo "--- Starting Crawler Resource Cleanup: $(date) ---"

# 1. Kill Chromium processes older than 1 hour
# Playwright sometimes leaves browser instances if the parent process crashes.
echo "Cleaning up lingering Chromium instances (older than 1h)..."
ps -eo pid,etime,comm | grep -E 'chrome|chromium' | while read pid etime comm; do
    # etime format: [[dd-]hh:]mm:ss
    if [[ $etime == *-* ]] || [[ ${#etime} -gt 5 ]]; then
        # If it has a day (-) or is longer than MM:SS (i.e., has hours), kill it.
        echo "Killing lingering browser process: $pid (Age: $etime)"
        kill -9 $pid 2>/dev/null
    fi
done

# 2. Kill Gunicorn workers that have no active Master
# If Supervisor restarts, sometimes old workers stick around.
echo "Checking for orphan Gunicorn workers..."
ps -ef | grep gunicorn | grep -v grep | while read uid pid ppid rest; do
    # If PPID is 1 (Init/Systemd) and it's a worker (not the master), it's likely an orphan
    if [[ $ppid -eq 1 ]]; then
        echo "Killing orphan Gunicorn process: $pid"
        kill -9 $pid 2>/dev/null
    fi
done

# 3. Force release of port 5000 if it's stuck but API is unresponsive
# We only do this if we can't get a 200 response from localhost:5000
if ! curl -s --max-time 2 http://localhost:5000/ > /dev/null; then
    echo "API on port 5000 is unresponsive. Forcing port release..."
    fuser -k 5000/tcp 2>/dev/null
fi

echo "--- Cleanup Complete ---"
