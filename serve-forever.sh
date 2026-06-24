#!/bin/bash
cd "$(dirname "$0")"

while true; do
  echo "Starting server..."
  node .next/standalone/server.js
  echo "Server died, restarting in 2 seconds..."
  sleep 2
done
