#!/usr/bin/env bash
# Sentinel — Terminal session logger
# Wraps `script` command to record terminal sessions to ~/sentinel-data/terminal-logs/

set -euo pipefail

LOG_DIR="$HOME/sentinel-data/terminal-logs"
mkdir -p "$LOG_DIR"

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="$LOG_DIR/session-${TIMESTAMP}.log"

echo ""
echo "  Sentinel — Session Logger"
echo "  Recording to: $LOG_FILE"
echo "  Type 'exit' to stop recording."
echo ""

script -q "$LOG_FILE"

echo ""
echo "  ✓ Session saved to $LOG_FILE"
echo ""
