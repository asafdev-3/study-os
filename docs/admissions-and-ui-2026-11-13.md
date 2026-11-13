# ENEM admission reference and UI corrections — 2026-11-13

## Scope
- Dashboard dock: remove orphan left borders and align both action rows; keep static mobile home.
- Paper reminders: subtle adhesive strip and paper lift, no oversized decorative pin/check circle; 44px completion target retained.
- Notebook: confirm deletion, filter by authenticated owner and note ID, require returned deleted ID before removing local state. Failure preserves note. Existing schema has owner-only FOR ALL policy; live RLS not audited in this task.
- ENEM Kira: fixed viewport layout with independently scrolling conversation, bottom composer, visualViewport resize/offset handling and hidden navigation during keyboard use.
- Ingresso: five ENEM scores, city/state, weighted comparison, minimums, normalized city matching, course/institution search, location scope and 20-card pagination. Inputs stored only on this device, scoped to user ID. No database migration or payment/security work.

## Data provenance and limits
`public/data/sisu-2025.json` contains 6,393 offers from 124 institutions and 547 city/UF pairs. It is a historical snapshot, NOT current vacancies or admission guarantees. Most cuts are dated 22 January 2025; each record displays its source date. Only exactly named Ampla concorrência records with zero bonus and usable cutoff are included. Other modalities, bonuses, missing cutoffs, private admissions and institutions outside the source are excluded.

Original collection: Sisu official offers API, as described by public mirror https://github.com/maiakanegae/sisu-data . MEC API and data portal returned HTTP 403 during research. Imported historical mirror at a pinned commit; exact URL and SHA-256 recorded in JSON. `scripts/import-sisu.py` reproduces normalization. MIT license preserved in `public/data/SISU-LICENSE.txt`. No candidate/person records imported.

Calculation: sum(score × course weight) / sum(weights), compare unrounded weighted value to cutoff, area minima and course minimum; zero essay cannot match. Display two decimals. Score inputs accept decimal dot/comma, 0–1000, no blanks/non-numeric values. City filter is exact accent/case-insensitive match, not geolocation or distance. Empty city/state allows broader lookup and is labeled accordingly.

Removed mock cutoffs, mock scholarships and unverified program requirements; links to each official program remain. UI explains historical scope and links to source version and https://sisu.mec.gov.br/#/relatorio .

## Verification
- `node tests/admissions.test.mjs`: range/format/decimal inputs, weights, minimums, accent normalization and all imported rows.
- `tests/study-flow.browser.mjs`: 320/414/1024px; dashboard clearance; post-it creation/completion; score/city/no-result/all-Brazil filters; composer position; simulated visualViewport keyboard; notebook cancellation/delete failure/success and owner filters; existing save/edit/review flows.
- `tests/motion.browser.mjs`: existing reduced-motion, blur transition, timer and main chat viewport regressions.
- Build and targeted ESLint. API responses in browser tests are mocked. Physical Safari/PWA keyboard and live database deletion require device/account verification; no production user annotations deleted for testing.
