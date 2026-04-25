#!/usr/bin/env bash
# sync-agent-rules.sh — propagate agent-rules/main.md to enabled targets.
#
# Single source of truth: agent-rules/main.md
# Targets are listed in agent-rules/.targets (one per line: claude/codex/cursor/cursor-legacy/vscode/trae)
#
# Usage:
#   ./scripts/sync-agent-rules.sh           # sync all enabled targets
#   ./scripts/sync-agent-rules.sh --dry-run # show what would change

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE="$ROOT/agent-rules/main.md"
TARGETS_FILE="$ROOT/agent-rules/.targets"

if [[ ! -f "$SOURCE" ]]; then
  echo "ERROR: $SOURCE not found." >&2
  exit 1
fi

if [[ ! -f "$TARGETS_FILE" ]]; then
  echo "ERROR: $TARGETS_FILE not found. Re-run create-opc-wiki or create it manually." >&2
  exit 1
fi

DRY_RUN=0
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=1
fi

write_target() {
  local target_path="$1"
  local prefix_content="${2:-}"
  local target_dir
  target_dir="$(dirname "$target_path")"

  if [[ "$DRY_RUN" == "1" ]]; then
    echo "  would write: $target_path"
    return
  fi

  mkdir -p "$target_dir"
  if [[ -n "$prefix_content" ]]; then
    { printf '%s\n' "$prefix_content"; cat "$SOURCE"; } > "$target_path"
  else
    cp "$SOURCE" "$target_path"
  fi
  echo "  wrote: $target_path"
}

CURSOR_MDC_PREFIX='---
description: Personal wiki agent rules
alwaysApply: true
---
'

while IFS= read -r target || [[ -n "$target" ]]; do
  # skip blank lines and comments
  [[ -z "$target" || "$target" == \#* ]] && continue

  case "$target" in
    claude)
      write_target "$ROOT/CLAUDE.md"
      ;;
    codex)
      write_target "$ROOT/AGENTS.md"
      ;;
    cursor)
      write_target "$ROOT/.cursor/rules/main.mdc" "$CURSOR_MDC_PREFIX"
      ;;
    cursor-legacy)
      write_target "$ROOT/.cursorrules"
      ;;
    vscode)
      write_target "$ROOT/.github/copilot-instructions.md"
      ;;
    trae)
      write_target "$ROOT/.trae/rules.md"
      ;;
    *)
      echo "WARNING: unknown target '$target' in $TARGETS_FILE — skipping" >&2
      ;;
  esac
done < "$TARGETS_FILE"

if [[ "$DRY_RUN" == "1" ]]; then
  echo "Dry run complete. Re-run without --dry-run to apply."
else
  echo "Sync complete."
fi
