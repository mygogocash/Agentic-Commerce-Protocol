#!/bin/bash

# setup-jules.sh
# Automated setup script for Google Jules AI Agent

echo "[Jules] Starting setup for Agentic Commerce Protocol..."

# 1. Check Node.js environment
if ! command -v npm &> /dev/null; then
    echo "[Error] npm is not installed or not in PATH."
    exit 1
fi

node_version=$(node -v)
echo "[Jules] Node.js version: $node_version"

# 2. Install Dependencies
echo "[Jules] Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "[Error] npm install failed."
    exit 1
fi

# 3. Environment Configuration Check
if [ ! -f .env.local ]; then
    echo "[Warning] .env.local not found. Copying from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env.local
        echo "[Jules] Created .env.local. PLEASE POPULATE WITH REAL CREDENTIALS."
    else
        echo "[Error] .env.example also missing. Cannot verify environment configuration."
    fi
else
    echo "[Jules] .env.local found."
fi

# 4. Build Verification (Optional but recommended)
echo "[Jules] Verifying build..."
# running build with --no-lint to save time, or fully if preferred. 
# For now, we'll do a full build to be safe.
npm run build
if [ $? -ne 0 ]; then
    echo "[Error] Build verification failed."
    exit 1
fi

echo "[Jules] Setup complete! Repository is ready."
exit 0
