#!/bin/bash
set -e
cd "$(dirname "$0")"
npm install --include=dev
npx vite build
npx tsc --project tsconfig.server.json
