#!/bin/bash

# Production Setup Script for Crawler Service (Revised)
# Run this inside the crawler-service directory

echo "Starting Production Setup for Crawler Service..."

# 1. Ensure python3-venv is installed (System Level)
if ! dpkg -s python3-venv >/dev/null 2>&1; then
    echo "python3-venv is missing. Installing..."
    sudo apt-get update && sudo apt-get install -y python3-venv python3-full
fi

# 2. Create Virtual Environment if it doesn't exist
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
fi

# 3. Use VENV's PIP to install dependencies (Avoids externally-managed-environment error)
echo "Installing dependencies..."
./.venv/bin/pip install --upgrade pip
./.venv/bin/pip install -r requirements.txt

# 4. Install Playwright Browsers using venv's playwright CLI
echo "Installing Playwright browsers..."
./.venv/bin/python -m playwright install --with-deps chromium

# 5. Create Log Directory
echo "Creating log directory..."
mkdir -p logs
chmod -R 775 logs

# 6. Spacy Model
echo "Downloading Spacy model..."
./.venv/bin/python -m spacy download en_core_web_sm

echo "Setup Complete!"
echo "Production Command: ./.venv/bin/gunicorn --workers 4 --bind 0.0.0.0:5000 app:app"

