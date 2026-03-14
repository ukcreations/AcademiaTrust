#!/bin/sh

# Create a simple index.html for health check
echo '<html><body><h1>AcademiaTrust is running!</h1></body></html>' > /var/www/html/index.html

# Start nginx
nginx -g "daemon off;" &

# Wait a moment for nginx to start
sleep 2

# Start FastAPI
cd /app
uvicorn main:app --host 0.0.0.0 --port 8000 &

# Keep the container running
tail -f /dev/null
