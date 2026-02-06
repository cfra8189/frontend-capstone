#!/bin/bash
set -e
cd "$(dirname "$0")"
npm install --include=dev
npx vite build
npx esbuild server/index.ts --bundle --platform=node --format=esm --outfile=dist/server/index.js --packages=external
