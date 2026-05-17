#!/bin/bash
# Scale Space Synth - First Time Setup (Linux)
# If double-click doesn't run this, open a terminal in this folder and run:
#   bash 1-INSTALL.sh
# Or make it executable: chmod +x *.sh

cd "$(dirname "$0")/../.."

echo
echo "============================================"
echo "  SCALE SPACE SYNTH - FIRST TIME SETUP"
echo "============================================"
echo

if ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: Node.js is not installed."
  echo "Install it via your package manager. Examples:"
  echo "  Debian/Ubuntu:  sudo apt install nodejs npm"
  echo "  Fedora:         sudo dnf install nodejs"
  echo "  Arch:           sudo pacman -S nodejs npm"
  echo "Or download from https://nodejs.org"
  read -p "Press enter to close..."
  exit 1
fi

echo "Working..."
npm install
if [ $? -ne 0 ]; then
  echo
  echo "Install failed. Scroll up to see what went wrong."
  read -p "Press enter to close..."
  exit 1
fi

echo
echo "============================================"
echo "  DONE."
echo "============================================"
echo "Next: 2-DEV-MODE.sh to edit, or 3-MAKE-BUILD.sh to ship."
read -p "Press enter to close..."
