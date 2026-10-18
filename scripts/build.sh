#!/usr/bin/env bash
# Build OpenResume for production.
# Usage: scripts/build.sh [--help]
set -euo pipefail

if [[ "${1:-}" == "--help" ]]; then
  cat <<'EOF'
Build OpenResume for production.

Runs the TypeScript check and Vite production build, writing static assets to dist/.

Usage:
  scripts/build.sh

Exit codes:
  0  build succeeded
  1  typecheck or build failed
EOF
  exit 0
fi

cd "$(dirname "$0")/.."
npm run build
