#!/bin/sh
set -e

# Start Fastify API server in background
cd /app
echo "Starting API server..."
NODE_PATH=/app/root_node_modules:/app/apps/api/node_modules node apps/api/dist/server.js &
API_PID=$!

# Wait for API to be ready (up to 30s)
echo "Waiting for API server on port 3001..."
for i in $(seq 1 30); do
  if wget -q -O /dev/null http://127.0.0.1:3001/health 2>/dev/null; then
    echo "API server ready!"
    break
  fi
  if ! kill -0 $API_PID 2>/dev/null; then
    echo "API server crashed!"
    exit 1
  fi
  sleep 1
done

# Start Next.js
echo "Starting Next.js on port 3000..."
node apps/web/server.js &
WEB_PID=$!

# Wait for either to exit
wait -n $API_PID $WEB_PID
exit $?
