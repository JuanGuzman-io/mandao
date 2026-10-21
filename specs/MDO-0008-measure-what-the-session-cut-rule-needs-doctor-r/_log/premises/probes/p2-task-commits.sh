#!/bin/sh
# P2: task commits carry a Mandao-Task trailer and a commit time that orders the tasks.
git log --format='%cI %(trailers:key=Refs,valueonly,separator=) %(trailers:key=Mandao-Task,valueonly,separator=)' --grep 'Mandao-Task' -n 6
