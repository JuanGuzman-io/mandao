#!/bin/sh
# P1: after EnterWorktree, which directory do Claude Code hooks see as the project?
echo "CLAUDE_PROJECT_DIR=${CLAUDE_PROJECT_DIR:-<unset>}"
echo "pwd=$(pwd)"
echo "toplevel=$(git rev-parse --show-toplevel)"
