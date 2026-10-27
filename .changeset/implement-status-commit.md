---
"mandao": patch
---

`/mandao-implement` no longer stops at the first task commit: the `in-progress` status is written by
`mandao run status <spec> in-progress --apply` and committed on its own by `mandao run commit-spec <spec> implement`.
A spec whose status was already set by hand gets the command that unblocks it.
