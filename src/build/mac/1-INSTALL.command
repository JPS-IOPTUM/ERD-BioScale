#!/bin/bash
cd "$(dirname "$0")/../.."
echo "Scale Space Synth - First Time Setup"
echo
if ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: Node.js not installed. Get it from https://nodejs.org"
  read -p "Press enter to close..."
  exit 1
fi
npm install
echo
echo "Done. Next: 2-DEV-MODE.command"
read -p "Press enter to close..."
