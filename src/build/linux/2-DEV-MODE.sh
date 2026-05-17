#!/bin/bash
# Scale Space Synth - Dev Mode (Linux)
# Close this window or press Ctrl+C to stop the dev server.

cd "$(dirname "$0")/../.."

echo
echo "============================================"
echo "  SCALE SPACE SYNTH - DEV MODE"
echo "============================================"
echo "Edit src/app.js or src/app.css; browser auto-refreshes."
echo "Ctrl+C or close this window to stop."
echo

if ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: Node.js not found. Run 1-INSTALL.sh first."
  read -p "Press enter to close..."
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "First-time setup needed; running it now..."
  npm install || { echo "Install failed."; read -p "Press enter..."; exit 1; }
fi

npm run dev
