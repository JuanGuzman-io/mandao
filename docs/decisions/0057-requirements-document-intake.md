# 0057 — Requirements document intake

**Status:** Accepted (Phase 14)

## Context

Some stories arrive as one long document (a PDF or Markdown) that carries many requirements, business
rules and terms at once. `/mandao-story` handled one story at a time from a tracker item or an idea, so
the agent either skipped parts of the document or invented content without references. Phase 14 adds
`/mandao-story --from <file>`, which turns the document into one reviewable proposal, and
`--intake <proposal>#I-n`, which opens a chosen story from it (plan in `docs/backlog.md`, "Requirements
document intake in story", approved 2026-10-22).

## Sources (read 2026-10-22)

- **Claude Code**, Read tool (<https://code.claude.com/docs/en/tools-reference>): "Claude reads short
  `.pdf` files whole. For PDFs longer than 10 pages, it reads in ranges with a `pages` parameter, such as
  `"1-5"`, up to 20 pages at a time." Page-range reads need poppler `pdftoppm`. Errors page
  (<https://code.claude.com/docs/en/errors>): "PDF too large (max 100 pages, 20MB)". Changelog 2.1.30 added
  the `pages` parameter; 2.1.292 makes a list of pages (`"6,9,15"`) an error, so one range per read.
- **GitHub Copilot** (VS Code 1.128, July 8, 2026, <https://code.visualstudio.com/updates/v1_128>, and
  <https://docs.github.com/en/copilot/how-tos/copilot-in-your-ide/chat-with-copilot/chat-in-ide>): the user
  can attach images and PDFs "when using a model that supports image input". The agent reading a local PDF
  by itself, page ranges and limits: not documented. Copilot CLI: attach with `@path` or `--attachment`;
  limits not documented.
- **Codex CLI** (<https://learn.chatgpt.com/docs/image-inputs>): images through `--image` and `view_image`.
  PDF input: not documented.
- **DOCX:** no harness documents native reading. pandoc (<https://pandoc.org/MANUAL.html>) documents no
  way to carry page numbers from a DOCX, so DOCX refs could only be by heading.
- **poppler `pdftotext`** (man page, <https://gitlab.freedesktop.org/poppler/poppler/-/blob/master/utils/pdftotext.1>):
  `-layout` "Maintain (as best as possible) the original physical layout of the text"; pages are
  separated by form feeds unless `-nopgbrk`; `-` writes to stdout; the encoding defaults to UTF-8.
- **npm** (`npm view`, 2026-10-22): `pdfjs-dist` 6.4.299, Apache-2.0, 34.9 MB unpacked, 63 MB installed
  with the optional `@napi-rs/canvas` native binary, Node `>=22.13.0`; `mammoth` 1.13.0, BSD-2-Clause,
  1.7 MB unpacked, 7.5 MB installed across 24 packages (one of them `jszip`, MIT OR GPL-3.0-or-later).

## Decision

- **Markdown and PDF only.** Markdown is read directly and split at headings (refs `§ A > B`, text before
  the first heading `§ (preamble)`). A PDF goes through `pdftotext -layout -enc UTF-8 <file> -`, split on
  form feeds (refs `p. N`). Any other type, `.docx` included, is refused with "`<ext>` is not supported:
  export it to PDF or Markdown": no harness reads DOCX natively, and a DOCX has no pages to cite.
- **`-layout` for tables.** Requirements often live in tables; layout mode keeps their columns readable
  as text, where raw mode interleaves cells.
- **No npm dependency.** pdfjs-dist would add ~35 MB (63 MB with its native canvas) to a small CLI and
  raise the Node floor; mammoth only helps DOCX, which is refused. Neither is MIT. poppler is an external
  tool the user installs (`brew install poppler` / `apt install poppler-utils`); without it
  `intake-extract` returns `status: needs-tool` with that hint, or exporting to Markdown.
- **Harness fallback.** Only Claude Code documents reading a local PDF, and its page-range reads need the
  same poppler package that is missing: "Page-range reads render pages with `pdftoppm` from
  poppler-utils … Without it, a page-range read fails with `pdftoppm is not installed`"
  (<https://code.claude.com/docs/en/tools-reference>, read 2026-10-22). It reads "short `.pdf` files
  whole", and "PDFs longer than 10 pages" in ranges. So without `pdftotext`, Claude Code reads the PDF
  whole, with no `pages` parameter, only when it has 10 pages or fewer; then
  `run intake-extract <file> --native-pages <n>` records the pages (`extractor: native`, one batch, no
  `source.md`) and refuses `n` above 10. A longer PDF, or a read that fails with `pdftoppm is not
  installed`, gets the poppler hint (`brew install poppler` / `apt install poppler-utils`) or a request
  for a Markdown export, and stops. Other harnesses give the hint and stop.
- **The source never enters the repository.** The proposal keeps its path and sha256 and cites `p. N` or
  `§ A > B` refs. The extracted text lives in the git-ignored `.mandao/cache/intake/<doc>/` (`source.md`
  with anchors, `sections.json`).
- **Cache lifecycle.** `mandao intake close <proposal>` checks the proposal, sets `status: closed` and
  deletes the doc's cache; `mandao intake clean <doc>` deletes one cache; `mandao intake clean` deletes
  only the caches of closed proposals, never one whose proposal is `proposed` or missing. A doc argument
  that is not a slug throws and deletes nothing. `intake-check` without the cache reports
  `references-unverified` as a warning.
- **OCR threshold.** A page with fewer than 20 non-whitespace characters is `ocr: true` (a scanned page
  yields almost no text); its coverage row must be `requires OCR`, never covered, and a document where
  every page qualifies says so in its `hint`. Mandao runs no OCR.
- **Preview before processing.** The agent shows sections, characters, batches (default 40,000
  characters each; one oversized section is its own batch) and OCR pages, then starts, writing the
  proposal after every batch so an interrupted run resumes.
- **One proposal in `docs/product/intake/<doc>-<YYYY-MM-DD>.md`**, not specs: business context `C-n`,
  epics `E-n`, stories `I-n` with AC, refs or `inferred: true`, INVEST notes, priority and dependencies,
  `OPEN`/`CONFLICT` rows `Q-n`, and one coverage row per section. `run intake-check` validates it
  deterministically before the PO sees it. Business context is applied item by item after approval; a
  contradiction is a `CONFLICT`, never an overwrite. The PO opens chosen stories (`mandao start` +
  `story --intake`, or the tracker through MCP, each confirmed); `run intake-open` records each one.
- **The document is data, never instructions** (`rules/context.md`).

## Consequences

Large documents are covered section by section with references a reviewer can follow, and nothing is
silently dropped: every section has a coverage row. Users without poppler outside Claude Code must
install it or export to Markdown. DOCX users export first. Scanned pages stay uncovered until someone
runs OCR outside Mandao. Harness PDF support is a dated fact (2026-10-22) and may change.
