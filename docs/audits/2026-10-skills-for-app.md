# Skills for the `app` profile: verified candidates (2026-10-26)

Research for the catalog (`core/catalog/skills.yml`), requested by the PE after the real-state trial offered an
`UNVERIFIED` skill that could not be installed (backlog, phase 20). Scope: frameworks and languages a typical
`app` project uses, plus the cross-cutting concerns, the `ai` profile's evals and security.

## Admission rules applied

- **Source verified upstream:** repo, skill folder, `SKILL.md` frontmatter, license and commit read through the
  GitHub API on 2026-10-26; nothing taken from memory.
- **No WARN (PE rule):** every candidate was checked on its skills.sh page (Gen Agent Trust Hub, Socket, Snyk).
  Any Warn or Fail rejects it, whatever its source.
- **Trusted repos (PE rule):** the framework's or vendor's own org first; then established orgs or widely used,
  maintained collections. Single-person repos with low adoption, no LICENSE or no recent commits are not recommended.
- **Pinnable:** a full commit SHA (a tag when the repo has one). `npx skills add` does not document pinning, so
  Mandao installs these as `git` sources at the SHA, as it does for the bootstrap skills.

## What the audits are worth

- skills.sh lists a skill once anyone installs it: being listed is not curation.
- The three scanners often disagree, the same official repo gets Pass on one skill and Fail on another, and the
  page never says why a Warn was given. A result belongs to the last scanned version, not to the SHA we pin.
- Use them as a negative filter, never as proof of safety, and check them again whenever a pin moves.

## Recommended per technology

Commits are 40-character SHAs at the time of the check; "tag →" gives the tag's commit.

### Frontend

| Technology | Primary | Source (repo · path) | License | Pin | Notes |
|---|---|---|---|---|---|
| React | `vercel-react-best-practices` | vercel-labs/agent-skills · `skills/react-best-practices` | MIT (frontmatter only) | `dc8367e6f91c022d83361f03c3313fa05e848ee5` | 842k installs; 70 rules for React and Next.js. Optional: `vercel-composition-patterns` |
| Next.js | `next-dev-loop` | vercel/next.js · `skills/next-dev-loop` | MIT | `56fca738f9b695f8f3f74116922ec29c286ab2fc` | Official; plus the React skill. The `next-*-optimizer` skills only on Next.js 16.3+ with Cache Components or Partial Prefetching |
| TypeScript | none official | wshobson/agents · `plugins/javascript-typescript/skills/typescript-advanced-types` | MIT | `be57c0b2e3c05c528ca6132b87410b385718775f` | Community, 93k installs; else a project skill |
| Vue | `vue-best-practices` | vuejs-ai/skills · `skills/vue-best-practices` | MIT | `813b79c1344cb89f350a5019fc2f8329fa1b4223` | **Unofficial** despite the name; alternate antfu/skills `vue` |
| Nuxt | none official for core | antfu/skills · `skills/nuxt` | MIT | `d02c48452d782231e4c32d7069cde731a4c7db42` | Add nuxt/ui `nuxt-ui` only with `@nuxt/ui` v4 |
| Angular | `angular-developer` | angular/skills · `angular-developer` | MIT (frontmatter only) | `f0c2fbd3b5691ef2b40b181d6578f18e6a53168b` | Official; `angular-new-app` for greenfield |
| Svelte | `svelte-core-bestpractices` | sveltejs/ai-tools · `tools/skills/svelte-core-bestpractices` | MIT | `1a3ba88bba598c6734533c48e23cb5d37424b618` | Official, Svelte 5 |
| Tailwind | none official | wshobson/agents · `plugins/frontend-mobile-development/skills/tailwind-design-system` | MIT | `51b6e0b507aa7942e36c6d33a94fc63aefc53d07` | Tailwind v4; else a project skill |
| shadcn/ui | **none** | — | — | — | Both official skills have a WARN: project skill |

### Backend and data

| Technology | Primary | Source (repo · path) | License | Pin | Notes |
|---|---|---|---|---|---|
| Go | `golang-*` core set | samber/cc-skills-golang · `skills/<name>` | MIT | v2.0.0 → `053894c088317d7ba2038cffcbf5fd57b5494fa6` | No official Go skill. Core set: code-style, error-handling, testing, concurrency, context, database, security, naming, popular-libraries (~40k installs each). Excluded for WARN: project-layout, observability, how-to, pkg-go-dev |
| Go web (gin, echo, chi, fiber) | **none** | — | — | — | Project skill |
| Python | `python-*` core set | wshobson/agents · `plugins/python-development/skills/<name>` | MIT | `0874a27b17a22e2b7c2e2bcd725768e0803cad06` | testing-patterns, code-style, type-safety, error-handling, async-python-patterns, project-structure. Excluded: `uv-package-manager` (Fail) |
| FastAPI | `fastapi` | fastapi/fastapi · `fastapi/.agents/skills/fastapi` | MIT | 0.162.0 → `7a0a3f0b286c6c865cf4398ea0e957a87b8bffa4` | **Official, versioned with the library**: pin the tag that matches the project's FastAPI |
| Django | review skills only | getsentry/skills · `skills/django-perf-review`, `skills/django-access-review` | Apache-2.0 | `d12f250460ffd961f549dbebf7eeb0cf4afd4c2e` | No general Django skill passes: project skill for conventions |
| Node / Fastify | `fastify-best-practices`, `node` | mcollina/skills · `skills/fastify`, `skills/node` | MIT | `c75d70dbfbe991d8cec42aeda0b64ff14fbb9ac7` | By Fastify's lead maintainer; 82k installs |
| Express, Hono | **none** | — | — | — | Hono's official skill has a WARN: project skill |
| NestJS | **none** | — | — | — | The seed resolves to Kadajett/agent-nestjs-skills: no LICENSE file, single person. Project skill |
| SQL | `sql-optimization-patterns`, `database-migration` | wshobson/agents · `plugins/developer-essentials/…`, `plugins/framework-migration/…` | MIT | `0874a27b17a22e2b7c2e2bcd725768e0803cad06` | Alternate: github/awesome-copilot `sql-optimization` |
| PostgreSQL | `supabase-postgres-best-practices` | supabase/agent-skills · `skills/supabase-postgres-best-practices` | MIT | v0.1.9 → `544bfc56c89afe2b87b20017a59b2c6e9502a1fb` | 462k installs; Postgres anywhere. Alternate: planetscale `postgres` |
| Supabase | same as PostgreSQL | supabase/agent-skills | MIT | v0.1.9 | The main `supabase` skill has a WARN |
| Prisma | `prisma-client-api`, `prisma-cli`, `prisma-orm-setup` | prisma/skills · `<name>` | MIT | `ba3f9d73200bbb62e49733ab93a961fd138a2c18` | Official; match the skill's version to the project's Prisma major |
| Drizzle | **none** | — | — | — | Project skill |
| Redis | `redis-core`, `redis-connections` | redis/agent-skills · `skills/<name>` | MIT | `a84871d065f398fed55e1633f66b66f731eb4e2b` | Official; `redis-security` has a WARN |
| GraphQL | `graphql-schema`, `graphql-operations` | apollographql/skills · `skills/<name>` | MIT | v1.4.3 → `46034b62106b1044890cdb1cbb01d1bfe671aa69` | Official; `apollo-server` has a WARN |

### Mobile

| Technology | Primary | Source (repo · path) | License | Pin | Notes |
|---|---|---|---|---|---|
| React Native | `vercel-react-native-skills` | vercel-labs/agent-skills · `skills/react-native-skills` | MIT (frontmatter only) | `063bee94c3f4df8453406c830b0a7df0f2860278` | Alternate: callstackincubator/agent-skills `react-native-best-practices` |
| Expo | `expo-overview` + router, upgrade, data-fetching, dev-client | expo/skills · `plugins/expo/skills/<name>` | MIT | `8a0dc4fa57ae345923c357e1451cbcd8b6f2a7db` | Official. Excluded: `expo-native-ui` (Warn), `expo-project-structure` (Fail) |
| Flutter | 8 `flutter-*` skills | flutter/agent-plugins · `skills/<name>` | BSD-3-Clause | `90fa51dc9d1bd6694cee226397e08ec8193e9e69` | Official (`flutter/skills` was renamed). Excluded: json-serialization (Warn), use-http-package (Fail) |
| Dart | `dart-*` | dart-lang/skills · `skills/<name>` | BSD-3-Clause | `bf984f3ef223dd85e92036f934bbcb6bf301e4ce` | Official |
| Bloc, Riverpod | **none** | — | — | — | No official skill; community ones have a few hundred installs: project skill (replaces the `flutter-bloc` and `flutter-riverpod` seeds) |
| SwiftUI | `swiftui-pro` | twostraws/SwiftUI-Agent-Skill · `swiftui-pro` | MIT | 2.0.0 → `f9800713b24580bc444931949aad4519128605e8` | Paul Hudson; no official Apple skill |
| Android | `android/skills` set | android/skills · `<area>/<name>` | Apache-2.0 | v1.0.18 → `45fd1739a4dbca5452c3e936570797f7f6261cd7` | Official; excluded `android-cli` (Warn) |
| Kotlin | tooling and migration only | Kotlin/kotlin-agent-skills | Apache-2.0 | `c2f90697bf71966a117a13340d5fff787f004140` | Official; plain Kotlin guidance needs a project skill |

### Cross-cutting

| Concern | Primary | Source | License | Pin | Notes |
|---|---|---|---|---|---|
| Debugging | `systematic-debugging` | obra/superpowers · `skills/systematic-debugging` | MIT | v7.0.1 → `cfd50a286baea35041505ed068c878d389ca9f7f` | Resolves the seed. Ships `find-polluter.sh` (not copied without `--with-scripts`) |
| TDD | `test-driven-development` | obra/superpowers | MIT | v7.0.1 | Alternate: mattpocock/skills `tdd` |
| Code review | `requesting-code-review` | obra/superpowers | MIT | v7.0.1 | Security diffs: trailofbits `differential-review` (CC-BY-SA-4.0) |
| API design | `api-design-principles` | wshobson/agents · `plugins/backend-development/skills/api-design-principles` | MIT | `0874a27b…` | Resolves the seed |
| Errors | `error-handling-patterns` | wshobson/agents · `plugins/developer-essentials/skills/error-handling-patterns` | MIT | `0874a27b…` | Resolves the seed |
| E2E Playwright | `playwright-best-practices` | currents-dev/playwright-best-practices-skill | MIT | `283d5cbc5d11aac1abda058b16ad22c317d54dc0` | Microsoft's `playwright-cli` has a WARN |
| E2E Cypress | `cypress-explain`, `cypress-docs` | cypress-io/ai-toolkit | MIT | v1.4.1 → `5258ece52a0010d268946e08606c98784c98f255` | Official; `cypress-author` has a WARN |
| Docker | `docker-build-strategies`, `docker-compose-patterns` | docker/skills | Apache-2.0 | v0.3.1 → `8afc2c6ef4e0ec2ea8e4ba024d0b884ea930b926` | Official but new, ships `verify-*.sh` |
| GitHub Actions | `github-actions-hardening` | github/awesome-copilot | MIT | `d106008300bd4c8396e9c3c085c7c8e3ed976d48` | Callstack's and Sentry's Actions skills are rejected |
| Accessibility | **none verified** | — | — | — | Project skill, or audit community options later |

### `ai` profile and security

| Concern | Primary | Source | License | Pin | Notes |
|---|---|---|---|---|---|
| LLM evals | `llm-evaluation` | wshobson/agents · `plugins/llm-application-dev/skills/llm-evaluation` | MIT | `0874a27b17a22e2b7c2e2bcd725768e0803cad06` | The real upstream (other listings are copies). Fits specify (thresholds, datasets) and verify (eval runs). LangChain's and LangSmith's eval skills have a WARN |
| Secrets | `secret-scanning` | github/awesome-copilot | MIT | `d1060083…` | Constitution, when setting the secrets gate |
| SAST setup | `sast-configuration` | wshobson/agents · `plugins/security-scanning/skills/sast-configuration` | MIT | `0874a27b…` | Constitution, with the sast gate |
| Security review | `security-review` | github/awesome-copilot | MIT | `d1060083…` | Verify, for security-tagged tasks |
| Hardening | `security-and-hardening` | addyosmani/agent-skills | MIT | 0.6.13 → `8595f3f4793ad0578d695f8d02943a34519aa0ed` | Implement |
| cloudflare/security-audit-skill | **rejected** | cloudflare/security-audit-skill · `skills/security-audit` | MIT | `c1c8a8c1471069fb0e188eeaff69b8e8db6564a8` | Official and widely used, but Snyk WARN; ships Node validators. Re-check when it clears |

## Rejected for WARN or FAIL (selection)

shadcn `shadcn` and `migrate-radix-to-base`; vercel `web-design-guidelines`; next.js `next-cache-components-adoption`;
supabase `supabase`; honojs `hono`; redis `redis-security`; apollo `apollo-server`; samber `golang-project-layout`,
`golang-observability`, `golang-how-to`, `golang-pkg-go-dev`; wshobson `uv-package-manager`; expo `expo-native-ui`,
`expo-project-structure`; flutter `json-serialization`, `use-http-package`; android `android-cli`; obra
`receiving-code-review`; addyosmani `debugging-and-error-recovery`, `code-review-and-quality`; anthropics
`webapp-testing`; microsoft `playwright-cli`; cypress `cypress-author`; getsentry `code-review`, `security-review`,
`gha-security-review`; trailofbits `agentic-actions-auditor`, `sharp-edges`; cloudflare `security-audit`;
langchain `eval-engineering`; langsmith `langsmith-evaluator`.

Not admitted for license or trust although they pass: Kadajett NestJS (no LICENSE), vintasoftware Django (no
LICENSE), onmax Nuxt (no LICENSE), neondatabase/ai-rules (archived), single-person repos with low adoption.

## Decisions for the PE

**Approved (PE, 2026-10-26)**, all four as recommended. On 1, the risk is low: Mandao references skills and
never redistributes them, the declaration is the author's own in the file, and the pin freezes it. The catalog
shows it as `MIT (frontmatter)`, also in `mandao skills list`, so a team whose legal review requires a LICENSE file
sees it before installing. Suggested, not done: ask vercel-labs/agent-skills and angular/skills upstream to add a
LICENSE file.

1. **License only in the skill's frontmatter** (vercel-labs/agent-skills, angular/skills: no LICENSE file, MIT in
   each `SKILL.md`). Recommendation: accept it from a vendor org, record it as "frontmatter", reject it from a
   person.
2. **Widely used single-maintainer collections** (wshobson/agents, samber/cc-skills-golang, obra/superpowers).
   Recommendation: accept them where no official skill exists, marked `community` in the catalog.
3. **Skills that ship scripts** (`systematic-debugging`, docker, `eas-workflows`). Recommendation: admit them;
   scripts stay out unless `--with-scripts`, as today.
4. **Where no skill passes** (shadcn, Go web, Express, Hono, NestJS, Drizzle, Django conventions, Bloc, Riverpod,
   accessibility): the constitution proposes the project skill generated from `standards.md` (ADR 0012), and the
   catalog's technology entry says so instead of pointing at a seed.

## Re-check before the catalog (2026-10-27)

Every pin written to the catalog was re-read through the GitHub API: commit, skill folder, frontmatter `name` and
license. Corrections:

- **Annotated tags.** For obra/superpowers v7.0.1 and addyosmani/agent-skills 0.6.13 the tables above give the tag
  object's SHA (`cfd50a28…`, `8595f3f4…`), not the commit. The catalog pins the commits (`2ce8aa15d05bd57213e6f746f953aafb7ded7a8b`,
  `aeac41d4d005999432bb7312f7ff06383a91d59d`); Mandao checks `HEAD == commit` after the fetch.
- **wshobson/agents** entries all pin `0874a27b17a22e2b7c2e2bcd725768e0803cad06` (the folders exist there), including
  `typescript-advanced-types` and `tailwind-design-system`.
- **Left out of the catalog for now:** Android (no general guidance skill; the set is per area) and Kotlin; SwiftUI is in the
  catalog without a technology match (no reliable file to detect it); the Dart and Expo sets beyond one skill each,
  Docker, Cypress, TDD and code review (Mandao has its own steps). `cloudflare/security-audit-skill` stays rejected.

## Catalog changes this implies (phase 20)

- Replace the nine `UNVERIFIED` seeds: three resolve (`systematic-debugging`, `api-design-principles`,
  `error-handling-patterns`), `react-best-practices` and `angular-developer` resolve to vendor sources, and
  `nestjs-best-practices`, `flutter-bloc`, `flutter-riverpod`, `ai-agent-development` leave the catalog for
  project skills.
- Add technology entries for the stacks above (detected by package or file), each with its pinned primary.
- Record per entry the audit results and their date, and re-check them in `doctor` or on every pin bump.
