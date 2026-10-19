#!/bin/sh
set -eu

if command -v node >/dev/null 2>&1; then
  node --test
else
  sh "$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)/tests/static-smoke.sh"
fi
