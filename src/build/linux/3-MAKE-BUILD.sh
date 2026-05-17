#!/bin/bash
# Scale Space Synth - Make Build (Linux)

cd "$(dirname "$0")/../.."

echo
echo "============================================"
echo "  SCALE SPACE SYNTH - MAKE BUILD"
echo "============================================"
echo

if ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: Node.js not found. Run 1-INSTALL.sh first."
  read -p "Press enter to close..."
  exit 1
fi

if [ ! -d node_modules ]; then
  npm install || { echo "Install failed."; read -p "Press enter..."; exit 1; }
fi

npm run build || { echo "Build failed."; read -p "Press enter..."; exit 1; }

echo
echo "============================================"
echo "  DONE."
echo "============================================"
echo "Your shareable file: dist/index.html"

# Try to open the dist folder. xdg-open is GNOME/KDE/etc; gracefully fall back.
if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "../dist" 2>/dev/null
fi
read -p "Press enter to close..."
