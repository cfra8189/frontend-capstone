#!/bin/bash
cd "$(dirname "$0")"
PORT=5000 node dist/server/index.js
