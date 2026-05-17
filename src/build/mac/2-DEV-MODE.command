#!/bin/bash
cd "$(dirname "$0")/../.."
echo "Scale Space Synth - Dev Mode (close this window to stop)"
echo
[ ! -d node_modules ] && npm install
npm run dev
