#!/bin/sh
# P1: the claude CLI has terminal subcommands to add a marketplace and install a plugin.
# Read-only: only --help and --version, nothing is installed.
set -e
claude --version
echo '--- claude plugin marketplace add --help'
claude plugin marketplace add --help
echo '--- claude plugin install --help'
claude plugin install --help
