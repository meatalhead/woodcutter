#!/bin/bash
# Startup script for Sheet Cutting Optimizer

set -e

echo "🪵 Starting Sheet Cutting Optimizer..."

# Check if running in Docker
if [ -f /.dockerenv ]; then
    echo "Running in Docker container"
    cd /app
    
    # Create database directory
    mkdir -p /app/data
    
    # Start FastAPI server
    uvicorn app.main:app --host 0.0.0.0 --port 8000
else
    echo "Running locally"
    
    # Check for virtual environment
    if [ ! -d "venv" ]; then
        echo "Creating virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Install dependencies
    echo "Installing dependencies..."
    pip install -q -r backend/requirements.txt
    
    # Create database directory
    mkdir -p data
    
    # Export environment variable
    export DATABASE_URL="sqlite:///./data/woodcutter.db"
    export PYTHONPATH="${PYTHONPATH}:${PWD}/backend"
    
    # Start server
    echo "Starting server on http://localhost:8000"
    cd backend
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
fi
