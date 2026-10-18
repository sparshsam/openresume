#!/usr/bin/env bash
# Lint and format-check OpenResume.
# Usage: scripts/lint.sh [--help] [--fix]
set -euo pipefail

if [[ "${1:-}" == "--help" ]]; then
  cat <<'EOF'
Lint and format-check OpenResume.

Usage:
  scripts/lint.sh        ESLint plus Prettier check
  scripts/lint.sh --fix  Apply Prettier formatting and ESLint fixes

Exit codes:
  0  no issues
  1  lint or formatting issues found
EOF
  exit 0
fi

cd "$(dirname "$0")/.."
if [[ "${1:-}" == "--fix" ]]; then
  npx prettier --write .
  npx eslint . --fix
else
  npx eslint .
  npx prettier --check .
fi
