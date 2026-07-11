#!/bin/sh

# Start Fastify API server in background
cd /app
NODE_PATH=/app/api_node_modules node apps/api/dist/server.js &
API_PID=$!

# Wait for API to be ready
echo "Waiting for API server..."
for i in $(seq 1 30); do
  if wget -q -O /dev/null http://localhost:3001/health 2>/dev/null; then
    echo "API server ready"
    break
  fi
  sleep 1
done

# Start Next.js
node apps/web/server.js &
WEB_PID=$!

# Wait for either to exit
wait -n $API_PID $WEB_PID
exit $?
