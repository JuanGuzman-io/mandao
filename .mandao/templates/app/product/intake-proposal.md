---
schema_version: 1
source: { path: "<path>", sha256: "<hex>", extractor: pdftotext }   # extractor: pdftotext | markdown | native
doc: <slug>
date: YYYY-MM-DD
status: proposed         # proposed | closed (mandao intake close)
---

# Intake: <document title>

<One line: what the document is, who sent it, and how many stories it proposes.>

## Business context

Applied to the constitution folder (`paths.constitution`) item by item, only after approval. A contradiction is `CONFLICT`, never
an overwrite.

| ID | Kind | Proposal | Target | Ref | Status |
|---|---|---|---|---|---|
| C-1 | rule | | business-rules.md | p. 1 | proposed |

## Epics

### E-1 — <name>
<one paragraph>; refs: [p. 1]

## Stories

### I-1 — <title>
- epic: E-1
- refs: [p. 1]
- priority: Must
- depends_on: []
- group: G-1          # optional: stories of one group open as one spec
- invest: <short note>
#### AC-1 — <name>
- GIVEN … / WHEN … / THEN …

## Open and conflicts

| ID | Type | Question or contradiction | Ref | Status |
|---|---|---|---|---|
| Q-1 | OPEN | | p. 1 | open |

## Coverage

One row per section of the document. A section that requires OCR is never covered.

| Section | Ref | Covered by | Status |
|---|---|---|---|
| S1 | p. 1 | I-1, C-1 | covered |
