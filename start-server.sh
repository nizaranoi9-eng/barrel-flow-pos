#!/bin/bash
cd "$(dirname "$0")"
exec npx next dev -p 3000 --webpack
