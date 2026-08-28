# GEO scoring on invest-gulf

The rubric, the harness and the doctrine come from `max-diver999/capetown-invest-website`
(branch `claude/capetown-content-audit-h6qbx7`, commit `90dc5e1`). That repository's own
`docs/GEO-SCORING.md` explains why a score must be a ceiling lowered by evidence rather than a
sum of rewards, and it is worth reading first. This file records what had to change to make it
mean anything **here**, and every measurement that justified a change.

## Why the previous scoring had to be replaced, measured on this site

The site already had a scorer, `scripts/lib/geo-citability-scorer.mjs`, and it was not merely
uninformative. Scored against labelled sets built from this repository's own history:

| set | what it is | old rubric |
|---|---|---|
| `bad` | 41 files as they stood at commit `745d602` | **mean 87.7** (min 85, max 91) |
| `good` | 4 articles composed sentence by sentence | **mean 72.5** (min 70, max 76) |
| `mid` | honest prose rebuilt semi-automatically | mean 72.3 |

**Separation: −15.2 points.** Not a small margin in the right direction, but a large one in the
wrong direction. All 41 machine-padded files scored above the best hand-written article, and
41 of 41 scored above the worst. The ordering was exactly inverted: `bad 87.7 > good 72.5 ≈ mid 72.3`.

The cause is visible in the generator that produced the garbage, which is still in the tree at
`scripts/geo-fix-corpus-90.mjs`. It was written to satisfy the old rubric's patterns directly:
it pads paragraphs to the length the rubric rewarded (`padToRange`), rewrites headings into the
question shape the rubric rewarded, and injects a `| Benchmark | Figure | DD use |` table because
a table earned points. A rubric that pays for shapes will be paid in shapes.

The new rubric scores the same three sets at **bad 3.2, mid 56.1, good 67.8** — separation
**64.5 points**, ordering correct, and 0 of 41 garbage files reach the worst hand-written article.

## The garbage commit

`745d602` — *"feat: lift all MDX pages to GEO citability 90+ and clean machine pads."*
610 files changed, 53,452 insertions. Its templates are legible in the generator source:

```
"typically require ${a} carry proof, ${b} DLD transfer fee awareness, and ${c} net yield modeling"
"Invest Gulf buyer desk files average ${d} turnaround when title deed and Oqood packs arrive"
```

The damage was not only additive. `areas/al-reem-island-property-investment.mdx` lost 386 lines
to gain 98 of padding, and among the deleted lines were the things a reader actually wants:
*"Medeor 24x7 Hospital Al Reem Island (full emergency services)"*, *"Reem Island Community School
(American curriculum)"*, and a real tenancy observation about 2-year Tawtheeq contracts producing
2-4% vacancy against a 7-8% citywide baseline.

## What had to be adapted, and what the measurements said

### Currency: the one change that silently breaks everything

The rubric arrived hard-coded for the South African rand, `(?<![A-Za-z])R\s?`, in five places
across three files. The porting instructions say a dollar site should substitute `\$\s?`. On this
corpus that would have been just as silent a failure as leaving it:

| notation | figures in the corpus |
|---|---|
| ISO currency codes (AED, SAR, QAR, OMR, BHD, KWD) | **24,970** |
| bare `$` | 85 |
| `USD` prefix | 587 |

So the pattern is an alternation over the codes the corpus actually uses, plus `$` and the
foreign codes that appear in comparison passages:
`(?:\b(?:AED|SAR|QAR|OMR|BHD|KWD|USD|GBP|EUR|SGD|INR)|\$)\s?`.
The negative lookbehind is gone: it existed only to stop `R` attaching to letters inside words,
and no ISO code has that problem.

Verified the way the playbook prescribes — `node scripts/geo-score.mjs <file> --explain` now lists
money among the shared unregistered figures (`aed 2 million (in 186 articles)`), where before the
provenance machinery saw only percentages and durations.

### Unit-type rules: the word list had to be measured, not inherited

The rule catches a figure bolted to a noun that cannot carry one. Inherited, it listed
`turnaround, awareness, confirmation, carry proof, LTV, occupancy, vacancy`. Measured across all
610 files at `745d602`:

| construction | hits | verdict |
|---|---|---|
| `% carry proof` | 16 | nonsense — not a measurable quantity |
| `% turnaround` | 22 | nonsense — a turnaround is a duration |
| `% LTV` | 246 | **legitimate** — loan-to-value is a percentage |
| `% occupancy` | 45 | **legitimate** — occupancy is a rate |
| `% vacancy` | 199 | **legitimate** — vacancy is a rate |
| `AED n vacancy` | 8 | **legitimate** — a dirham cost line in a carry stack |

`AED 5,000 management, and AED 4,000 vacancy` is a correct sentence about a cost stack. So
`LTV`, `occupancy` and `vacancy` were removed from the money form of the rule: on this corpus they
fire only on correct writing, and keeping them would have capped 490 legitimate pages and taught
writers to avoid the right word.

### Boilerplate declarations: started empty on purpose

`.content-os/boilerplate.txt` arrived carrying four declarations about South African transfer duty.
Each matched **zero** files here. They were removed rather than kept as harmless clutter, because
the file's whole value is being short enough to audit by eye. What this corpus repeats is
navigational (`Parent hub: ...`, `Related reading: ...`) at six files at most, and nothing yet
shows the detector treating those unfairly.

## Signals: one added, both exemptions measured

### Added — `pasted-block`, a count where the existing rule was a share

`crossSectionEcho` measures the *share* of an article's 8-word sequences that repeat between its
own sections. Shares dilute. `guides/uae-visa-overstay-fines` at `745d602` carries an identical
three-line checklist after nearly every heading — eleven copies — and in a 3,184-word article that
comes to 6%, under the 8% gate. It scored 29 and was the single file failing calibration.

A count does not dilute, and cannot be diluted deliberately by writing more prose around the pad.
Measured before it was added:

| set | mean max-repeat | max | files repeating a line 3+ times |
|---|---|---|---|
| bad | 7.46 | 31 | 18 of 41 |
| good | 1.00 | 1 | **0 of 4** |
| mid | 1.00 | 1 | **0 of 13** |

Perfect separation: every honest file in both sets repeats no line at all. The worst offender
pastes `- confirm the section numbers against live listings` 31 times.

Adding it moved `bad.max` from 29 to 22 and left `good` and `mid` **unchanged at 67.8 and 56.1** —
the requirement for any new rule is that it costs correct writing nothing, and this one costs
exactly nothing.

A measurement lesson worth recording: the first version of this experiment reported max-repeat = 1
for every file in all three sets, and the signal looked dead. It was not the corpus, it was the
probe — I had counted lines in `plainText()` output, which collapses all whitespace into a single
blob, so no line could ever repeat. The rule was measuring my own bug.

### Fixed — `malformed-output` was capping correct pages

The doubled-word arm, `\b(\w+)\s+\1\b`, gated 29 files at 40. Reading them showed two systematic
false-positive classes and one genuine hit:

| hit | page | verdict |
|---|---|---|
| `on on` | `DAMAC trails Emaar on on-time delivery` | **false** — the word boundary is satisfied by the hyphen |
| `model Model` | `...in every cash-flow model` / `Model net yield after...` | **false** — `plainText` collapses the newline, so a sentence boundary reads as a stutter |
| `Bla Bla` | a JBR beach club | **false** — a real proper noun |
| `Zaal Zaal` | `Founded by Zaal Zaal` | **true** — the founder is Zaal Mohamed Zaal; an earlier pass mangled the name |

Two narrow exclusions: not before a hyphen, and not lowercase-followed-by-capitalised. The
asymmetry in the second is what preserves the signal — a sentence boundary capitalises the *second*
word, while a genuine stutter at the start of a sentence capitalises the *first*, so `The the
transfer fee` is still caught. The gate now fires on 17 files instead of 29, calibration is
unchanged at 64.5, and `Zaal Zaal` is still flagged as the content bug it is.

Neither exemption was added because a page scored badly. Each was added because a page scored badly
*for being correct*, and in both cases the calibration was re-run to prove the exemption did not
weaken the signal.

### Fixed again — the `undefined` arm had no true positives on this corpus

Found during wave R2, by a page being capped at 40 for the phrase "an undefined cost with no end
date". The arm `\bundefined\b` exists to catch a template that rendered a JavaScript value into
prose, which really did reach production on the reference site. On this corpus it caught nothing of
the kind:

| occurrence | page | verdict |
|---|---|---|
| `for undefined cases` | `uae-will-difc-adgm` | **false** — ordinary adjectival English, and it predates this wave |
| `an undefined cost` | `dubai-sports-city-property-investment` | **false** — same |

Two hits in 593 files, both adjectival, none a leak. The rule was penalising the word on every
occurrence it found. The fix keeps the signal and narrows it to the shape a leak actually takes,
which is a value slot: `undefined` after a currency token or a digit, or `undefined` terminating a
clause. English adjectival use is always followed by the noun it modifies, so the two false
positives clear and `AED undefined`, `7 undefined`, `the fee is undefined.` and `charge undefined,`
are all still caught. `NaN` is untouched, having no English usage to protect.

Calibration after the change: separation 64.2 and 0/41 garbage above the worst hand-written file,
identical to before it. The narrowing cost the labelled sets nothing, which is what distinguishes
fixing a rule from loosening one.

## Rejected candidates

Recorded so nobody re-adds them on intuition. The first is from this site; the rest are inherited
from the reference implementation, where they were measured and failed.

| candidate | machine | hand-written | why rejected |
|---|---|---|---|
| max identical-line repeat, counted over `plainText` | 1.00 | 1.00 | measured nothing — `plainText` collapses newlines, so the probe could not see lines. Re-measured on raw lines it separates perfectly and *was* adopted |
| opener of 18–70 words | 90.5% of sections | 90.3% | separates nothing; 15 of 20 points paid to every article regardless |
| opener not starting with a pronoun | 99.9% | 100.0% | both classes pass always — free points |
| a figure in the opening sentence | 89.6% | 58.1% | separates *backwards*: machine text front-loads numbers |
| numbers must sit in a table | 29% prose-only | 53% prose-only | backwards: hand-written articles carry more prose figures |
| sentence-length variance | CV 0.603 | CV 0.464 | backwards: generated text was more variable |
| count of arithmetic chains | 0.31 | 0.60 | the semi-automatic middle scored highest, so it tracks nothing |

## The honest weakness of this calibration

State this plainly wherever the number is quoted.

**No human-written prose exists anywhere in this repository.** The root commit is a squashed import
of all 612 content files, and every one of the 593 files carries `author: "Invest Gulf Editorial"`.
The `good` set is therefore four articles written by the same kind of agent whose output this
rubric will grade. That is marking your own homework, and it has three consequences:

1. The score is a **relative** separator — "this page sits closer to the `745d602` end than to the
   August batch" — and not an absolute definition of good writing. `TARGETS` in
   `scripts/geo-calibrate.mjs` are tripwires, not quality thresholds.
2. `good.min` rests on **four files**. One weak section in one of them flips calibration.
3. The good set carries defects the rubric must penalise rather than learn: bare-digit injection in
   prose position (`one of 3 documentary errors`, `each of the 5 stages below`) and, in
   `qatar-foreign-ownership-rules-changelog`, the same fact written two ways in one file — `3
   designated areas` in the body against `three freehold areas` in the TL;DR, because a numeral pass
   rewrote the body and never touched the frontmatter.

Three further articles from that same August batch were **demoted out of the good set** into `mid`,
because they are mutually templated and would have taught the rubric to tolerate the one thing it
exists to catch: `by-product of a sound purchase` appears verbatim in three of them, `puts renewal
at risk` in two, `the current year and the two prior years` in two.

The fix is cheap and is not something an agent can do for itself: 15–20 files at HEAD, stratified
across the score distribution, rated 1–5 by a human, blind to filename and score. Until that exists,
this scorer should never be the only gate on new work.

## Commands

```bash
npm run geo:score                                  # whole corpus, ranked, with gates
node scripts/geo-score.mjs <file.mdx> --explain    # one article, every penalty
npm run geo:calibrate                              # does the rubric still separate the sets?
node scripts/geo-calibrate.mjs --old               # what the previous rubric scored
npm run geo:cannibals -- --min 60                  # page pairs sharing too much text
npm run facts:review                               # registry review dates and orphaned claims
```
