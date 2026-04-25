#!/usr/bin/env bash
# PostToolUse hook: runs Prettier, ESLint and project-wide typecheck after a file
# edit. Exits 2 on any failure so Claude receives the stderr feedback and fixes
# the issue before continuing.

set -uo pipefail

PAYLOAD="$(cat)"
PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-$PWD}"
cd "$PROJECT_ROOT" || exit 0

FILE_PATH="$(printf '%s' "$PAYLOAD" | jq -r '
  .tool_input.file_path
  // .tool_response.filePath
  // .tool_input.notebook_path
  // empty
')"

[[ -z "$FILE_PATH" ]] && exit 0
[[ ! -f "$FILE_PATH" ]] && exit 0

# Only act on files that live under the project root.
case "$FILE_PATH" in
  "$PROJECT_ROOT"/*) ;;
  *) exit 0 ;;
esac

# Skip generated / vendored locations.
case "$FILE_PATH" in
  *"/node_modules/"*|*"/dist/"*|*"/.angular/"*|*"/coverage/"*|*"/out-tsc/"*|*"/.git/"*)
    exit 0
    ;;
esac

# Restrict to source / config extensions we care about.
EXT="${FILE_PATH##*.}"
case "$EXT" in
  ts|tsx|js|jsx|mjs|cjs|html|css|scss|json|md) ;;
  *) exit 0 ;;
esac

ERRORS=()
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

run_step() {
  local name="$1"; shift
  local log="$TMP/$name.log"
  if ! "$@" >"$log" 2>&1; then
    ERRORS+=("[$name] failed:")
    ERRORS+=("$(cat "$log")")
  fi
}

# 1) Prettier — format the edited file in place.
run_step prettier npx --no-install prettier --write --log-level warn "$FILE_PATH"

# 2) ESLint — only meaningful for TS/JS/HTML in this project.
case "$EXT" in
  ts|tsx|js|jsx|mjs|cjs|html)
    run_step eslint npx --no-install eslint --fix "$FILE_PATH"
    ;;
esac

# 3) Project-wide typecheck — only when a TypeScript file changed.
case "$EXT" in
  ts|tsx)
    run_step typecheck npm run --silent typecheck
    ;;
esac

if (( ${#ERRORS[@]} > 0 )); then
  printf '%s\n' "${ERRORS[@]}" >&2
  exit 2
fi

exit 0
