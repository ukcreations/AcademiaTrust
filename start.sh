#!/bin/sh

# Start nginx in background
nginx &

# Start FastAPI in background
uvicorn main:app --host 0.0.0.0 --port 8000 &

# Wait for any process to exit
wait
