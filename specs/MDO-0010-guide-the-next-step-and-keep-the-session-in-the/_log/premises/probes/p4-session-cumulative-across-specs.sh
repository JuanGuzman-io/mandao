#!/bin/sh
# P4: a session's latest `cumulative` is in another spec's costs.yml, not only in the file being written.
session="${1:-bcd55241-6d37-4f74-91a8-e17d0d6a15c2}"
for f in specs/*/_log/costs.yml; do
  n=$(grep -c "session: $session" "$f")
  if [ "$n" -gt 0 ]; then
    last=$(grep -A40 "session: $session" "$f" | grep 'main-session:' | tail -1 | tr -d ' ')
    echo "$f: $n record(s) for $session; last $last"
  fi
done
exit 0
