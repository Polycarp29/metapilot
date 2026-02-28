#!/bin/bash
cd "/home/z3uxie/Desktop/MyProjects/analytics-engine"
source venv/bin/activate
nohup python3 worker.py > worker.log 2>&1 &
echo "Analytics Worker started in background with venv."
