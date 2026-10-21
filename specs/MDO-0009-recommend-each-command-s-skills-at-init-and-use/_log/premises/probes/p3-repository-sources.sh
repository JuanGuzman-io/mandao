#!/bin/sh
# P3: each repository source resolves its pinned tag to a commit, and the folder holds a SKILL.md
# with nothing it needs outside the folder. Read-only: ls-remote and a sparse, blob-less clone into
# TMPDIR (the premise runner removes it).
set -e
check() {
  url=$1; tag=$2; path=$3
  echo "=== $url $tag $path"
  git ls-remote --tags "$url" "refs/tags/$tag" "refs/tags/$tag^{}"
  dir=$(mktemp -d)
  git -c advice.detachedHead=false clone -q --depth 1 --branch "$tag" --filter=blob:none --sparse "$url" "$dir"
  git -C "$dir" sparse-checkout set --no-cone "/$path/"
  echo "HEAD $(git -C "$dir" rev-parse HEAD)"
  (cd "$dir/$path" && find . -type f | sort)
  echo '--- SKILL.md frontmatter'
  sed -n '1,6p' "$dir/$path/SKILL.md"
  echo '--- references that leave the folder (../, other skills)'
  grep -n -E '\.\./|superpowers:|skills/[a-z-]+/' "$dir/$path/SKILL.md" || echo '(none)'
}
check https://github.com/obra/superpowers v7.0.0 skills/brainstorming
check https://github.com/alirezarezvani/claude-skills v2.12.0 product-team/skills/product-manager-toolkit
check https://github.com/JuankCadavid/akili-specs v2.34.1 .claude/skills/software-architect
