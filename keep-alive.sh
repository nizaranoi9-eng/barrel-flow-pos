#!/bin/bash
while true; do
  cd "$(dirname "$0")"
  npx next dev -p 3000
  echo "Server died, restarting in 2 seconds..."
  sleep 2
done
