#!/usr/bin/env bash
# Run the OpenResume test suite.
# Usage: scripts/test.sh [--help] [--watch]
set -euo pipefail

if [[ "${1:-}" == "--help" ]]; then
  cat <<'EOF'
Run the OpenResume test suite.

Usage:
  scripts/test.sh          Run once (CI mode)
  scripts/test.sh --watch  Watch for changes

Exit codes:
  0  all tests passed
  1  one or more tests failed
EOF
  exit 0
fi

cd "$(dirname "$0")/.."
if [[ "${1:-}" == "--watch" ]]; then
  npm run test:watch
else
  npm run test
fi
