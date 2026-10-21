#!/bin/sh
# P4: each harness's official docs name the project skills folder Mandao copies into.
# Read-only: fetches public documentation pages and counts the folder names they mention.
doc() {
  harness=$1; url=$2
  echo "=== $harness $url"
  page=$(curl -fsSL --max-time 30 "$url") || { echo "fetch failed"; return; }
  for folder in .claude/skills .agents/skills .github/skills .opencode/skills; do
    n=$(printf '%s' "$page" | grep -o "$folder" | wc -l | tr -d ' ')
    echo "$folder: $n"
  done
  printf '%s' "$page" | grep -o -E '.{0,80}(\.github|\.agents|\.claude|\.opencode)/skills.{0,80}' | head -4
}
doc claude https://code.claude.com/docs/en/skills.md
doc codex https://learn.chatgpt.com/docs/build-skills.md
doc opencode https://opencode.ai/docs/skills/
doc copilot https://code.visualstudio.com/docs/copilot/customization/agent-skills
doc antigravity https://antigravity.google/docs/skills
