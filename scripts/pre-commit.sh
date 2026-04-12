#!/bin/sh
# Sentinel pre-commit hook template
# Auto-saves diff + stats to ~/sentinel-data/diffs/ on each commit

# SENTINEL AUTO-HOOK
SENTINEL_DIR="$HOME/sentinel-data/diffs"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
REPO_NAME=$(basename "$(git rev-parse --show-toplevel 2>/dev/null || echo "unknown")")
DIFF_FILE="$SENTINEL_DIR/${TIMESTAMP}_${REPO_NAME}_${BRANCH}.diff"
STATS_FILE="$SENTINEL_DIR/${TIMESTAMP}_${REPO_NAME}_${BRANCH}.stats"

mkdir -p "$SENTINEL_DIR"

# Save the staged diff
git diff --cached > "$DIFF_FILE"

# Save stats
{
  echo "timestamp: $TIMESTAMP"
  echo "repo: $REPO_NAME"
  echo "branch: $BRANCH"
  echo "files_changed: $(git diff --cached --numstat | wc -l | tr -d ' ')"
  echo "insertions: $(git diff --cached --shortstat | grep -oE '[0-9]+ insertion' | grep -oE '[0-9]+')"
  echo "deletions: $(git diff --cached --shortstat | grep -oE '[0-9]+ deletion' | grep -oE '[0-9]+')"
} > "$STATS_FILE"
