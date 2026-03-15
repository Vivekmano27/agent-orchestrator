#!/bin/bash
# Lint staged files by extension. Skips linters not on PATH.
# Advisory only — warns but does not block commits.
CHANGED=$(git diff --cached --name-only 2>/dev/null) || exit 0
[ -z "$CHANGED" ] && exit 0

ISSUES=0
for FILE in $CHANGED; do
  [ -f "$FILE" ] || continue
  case "${FILE##*.}" in
    ts|tsx|js|jsx)
      command -v eslint >/dev/null 2>&1 && eslint --no-error-on-unmatched-pattern "$FILE" 2>/dev/null || ISSUES=1 ;;
    py)
      command -v ruff >/dev/null 2>&1 && ruff check "$FILE" 2>/dev/null || ISSUES=1 ;;
    dart)
      command -v dart >/dev/null 2>&1 && dart analyze "$FILE" 2>/dev/null || ISSUES=1 ;;
    kt|kts)
      command -v ktlint >/dev/null 2>&1 && ktlint "$FILE" 2>/dev/null || ISSUES=1 ;;
    go)
      command -v golangci-lint >/dev/null 2>&1 && golangci-lint run "$FILE" 2>/dev/null || ISSUES=1 ;;
  esac
done

[ $ISSUES -ne 0 ] && echo "Lint issues found in staged files"
exit 0
