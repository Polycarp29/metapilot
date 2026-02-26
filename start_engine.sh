#!/bin/bash
cd "/home/z3uxie/Desktop/MyProjects/analytics-engine"
source venv/bin/activate
pip install -r requirements.txt
nohup python3 main.py > engine.log 2>&1 &
echo "Python Engine started in background with venv."

