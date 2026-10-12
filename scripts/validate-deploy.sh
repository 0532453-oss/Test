#!/bin/bash
set -e

# Production build validation script
# Validates that all deployable packages build and pass tests.

FAILURES=()

step() {
  echo ""
  echo "========================================="
  echo "  $1"
  echo "========================================="
}

check() {
  local name="$1"
  shift
  if "$@"; then
    echo "PASS: $name"
  else
    echo "FAIL: $name"
    FAILURES+=("$name")
  fi
}

step "1/6: Build shared libraries (types, utils, core)"
check "build @service-flex/types" pnpm --filter @service-flex/types build
check "build @service-flex/utils" pnpm --filter @service-flex/utils build
check "build @service-flex/core" pnpm --filter @service-flex/core build

step "2/6: Build flexdesk-server"
check "build flexdesk-server" pnpm --filter flexdesk-server build

step "3/6: Run flexdesk-server tests"
check "test flexdesk-server" pnpm --filter flexdesk-server test

step "4/6: Build flexdesk-preview-v2"
check "build @flexdesk/preview-v2" pnpm --filter @flexdesk/preview-v2 build

step "5/6: Run flexdesk-preview-v2 tests"
check "test @flexdesk/preview-v2" pnpm --filter @flexdesk/preview-v2 test

step "6/6: Typecheck flexdesk-preview-v2"
check "typecheck @flexdesk/preview-v2" pnpm --filter @flexdesk/preview-v2 typecheck

echo ""
echo "========================================="
if [ ${#FAILURES[@]} -eq 0 ]; then
  echo "  All checks passed"
  echo "========================================="
  exit 0
else
  echo "  FAILED: ${FAILURES[*]}"
  echo "========================================="
  exit 1
fi
