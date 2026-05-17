#!/bin/bash
cd "$(dirname "$0")/../.."
echo "Scale Space Synth - Make Build"
echo
[ ! -d node_modules ] && npm install
npm run build
echo
echo "Done. Your shareable file: dist/index.html"
open ../../dist
read -p "Press enter to close..."
