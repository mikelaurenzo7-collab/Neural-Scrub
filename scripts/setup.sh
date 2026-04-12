#!/usr/bin/env bash
# Sentinel — Standalone setup (no Node.js required)
# Creates ~/sentinel-data/ directory structure

set -euo pipefail

DATA_DIR="$HOME/sentinel-data"
DIRS=(
  "diffs"
  "screenshots"
  "reasoning-traces"
  "terminal-logs"
  "session-notes"
  "comparisons"
)

echo ""
echo "  Sentinel — Setup"
echo ""

for dir in "${DIRS[@]}"; do
  mkdir -p "$DATA_DIR/$dir"
  echo "  ✓ $DATA_DIR/$dir"
done

echo ""
echo "  ✓ All directories ready."
echo ""
