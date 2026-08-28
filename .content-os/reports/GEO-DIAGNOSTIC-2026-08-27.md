# GEO diagnostic, 27 August 2026

Scorer: `scripts/lib/geo/`, ported from `capetown-invest-website@90dc5e1` and adapted to this
corpus. Method and every adaptation measurement: `docs/GEO-SCORING.md`.

## 1. The old scoring was not neutral, it was inverted

Measured on labelled sets built from this repository's own history:

| set | what it is | old rubric | new rubric |
|---|---|---|---|
| `bad` | 41 files at commit `745d602` | **87.7** (min 85, max 91) | **3.2** (max 22) |
| `mid` | honest prose rebuilt semi-automatically | 72.3 | 56.1 |
| `good` | 4 articles composed sentence by sentence | **72.5** (min 70) | **67.8** (min 66) |

**Old separation: −15.2 points.** Machine-padded text scored fifteen points *above* hand-composed
prose, and 41 of 41 garbage files scored above the best hand-written article. The ordering was
inverted, not merely uninformative.

**New separation: 64.5 points**, ordering correct, 0 of 41 garbage files reaching the worst
hand-written article. Calibration passes: `bad.max 22 ≤ 25`, `good.min 66 ≥ 55`, `separation ≥ 35`.

The cause is legible. The generator that produced `745d602` is still in the tree at
`scripts/geo-fix-corpus-90.mjs`, and it implements the old rubric's rewards directly: it pads
paragraphs to the rewarded length, rewrites headings into the rewarded question shape, and injects a
`| Benchmark | Figure | DD use |` table because a table earned points. A rubric that pays for shapes
gets paid in shapes.

## 2. The corpus today

| | value |
|---|---|
| files | 593 |
| mean | **15.6** / 75 |
| median | 14 |
| min / max | 0 / 63 |
| pages scoring zero | **127** (21%) |

### By collection

| collection | n | mean | min | max | zeros | share at zero |
|---|---|---|---|---|---|---|
| areas | 57 | **7.1** | 0 | 26 | 22 | **39%** |
| compare | 29 | 12.2 | 0 | 39 | 9 | 31% |
| guides | 470 | 16.0 | 0 | 63 | 95 | 20% |
| projects | 25 | 21.7 | 0 | 47 | 1 | 4% |
| news | 12 | 35.6 | 13 | 53 | 0 | 0% |

`news` scoring highest is not an accident of sampling: those twelve pages are dated, single-subject
and short, which is the shape the rubric rewards. `areas` is worst because 57 pages describe 57
communities using one shared vocabulary of amenities and yields.

### Where the base is lost

| component | corpus average | of |
|---|---|---|
| openers | 11.7 | 20 |
| evidence | 13.9 | 15 |
| structure | 14.6 | 15 |
| rhythm | 5.3 | 8 |
| **provenance** | **0.5** | **10** |
| floor | 7.0 | 7 |

Structure and evidence are nearly full marks corpus-wide, which is exactly what a generator
optimising the old rubric would produce. The losses are in openers (sections restating their heading
instead of answering it) and provenance.

### Penalties

| penalty | occurrences | points |
|---|---|---|
| stamped-figure | 2,641 | **10,564** |
| hedging | 570 files | **8,997** |
| heading-echo | 609 | 3,045 |
| self-repetition | 96 | 1,583 |
| duplicated-text | 68 | 559 |
| template-family | 46 | 369 |
| implausible-precision | 13 | 174 |
| duplicated-volume | 11 | 84 |
| pasted-block | 1 | 4 |

Gates: echo-openers 33 files, self-repetition 26, malformed-output 17, no-section-structure 5,
mass-duplication 4.

## 3. Cannibals

Pairs sharing nine-word sequences, measured as a share of the smaller document:

| share | shared / total | pair |
|---|---|---|
| **25.0%** | 509 / 2,032 | `guides/ifza-company-setup` × `guides/meydan-free-zone-setup` |
| 12.8% | 122 / 956 | `compare/saudi-arabia-vs-uae-golden-visa` × `guides/gulf-banking-comparison-expats` |
| 11.8% | 113 / 956 | `guides/dubai-metaverse-property-nft-reality` × `guides/gulf-banking-comparison-expats` |
| 9.5% | 142 / 1,493 | `guides/oman-property-foreigner-living` × `guides/saudi-property-designated-zones-explained` |
| 7.5% | 130 / 1,735 | `guides/abu-dhabi-driving-license` × `guides/dubai-driving-license-guide` |
| 6.0% | 181 / 3,016 | `guides/ajman-rental-yield-guide` × `guides/umm-al-quwain-rental-yield-guide` |
| 6.0% | 112 / 1,873 | `guides/dubai-property-for-american-buyers` × `guides/dubai-property-for-british-buyers` |
| 6.0% | 157 / 2,627 | `guides/adek-school-ratings-abu-dhabi` × `guides/khda-school-ratings-explained` |

16 pairs sit above 60 shared sequences. The nationality-guide family is a cluster rather than a
pair: american × british 112, german × indian 102, british × indian 55, american × german 53.

## 4. The fact registries

Both are built and `npm run facts:review` passes.

`.content-os/facts.json` — 17 entries. It is deliberately small, and that is a measurement rather
than laziness: of the 32 most-shared figures in the corpus, **exactly one is registrable**. Almost
every high-frequency figure here is polysemous. `4%` is the DLD transfer fee on 228 pages and
several other things besides; `5%` is VAT on commission, an agency fee and a deposit share; `12
months` is a lease term, a bank-statement window and a tax-residency period. Registering those
would hand unrelated pages a provenance they have not earned, which is the failure this registry
exists to prevent. The registrable figures sit in the tail instead — institutional thresholds with a
distinctive value: AED 375,000, 183 days, 0.25%, AED 360,000, AED 1,520, SAR 4M, QAR 730,000,
OMR 250,000, BHD 200,000, and the AED 2 million Golden Visa line.

Measured effect: corpus mean 14.4 → **15.6**, zeros 140 → **127**, and 612 stamped-figure penalty
points removed across 128 files. Coverage stays at 3.3% of load-bearing figures, well under
`REGISTRY_GATE_COVERAGE` 0.8, so the registry gate stays disarmed and no page is capped by a
half-built registry.

The other 16 saturated figures cannot be fixed here. `12 months` (366 files), `4%` (228), `5%`
(212), `30 days` (211) and the rest are stamped across 149–366 files *precisely because they are
generic*. They come off only by rewriting pages to carry page-specific arithmetic, which is the
editorial rule restated as a number.

`.content-os/external-claims.json` — 23 claims about jurisdictions nobody here monitors: UK 6,
US 5, India 3, Canada 2, Germany 2, Russia 2, France 1, South Africa 1, Australia 1. Keyed by the
claim rather than the figure, each with a `reviewBy` six months out.

**Both registries are unverified.** This environment has no network access, so every `asOf` is the
date the corpus was indexed, not the date a human re-read the instrument. Each entry carries
`"verified": false` and needs checking against its named source before it is treated as sourced.

## 5. Wave plan — awaiting approval

48 pages, four waves, ordered worst-first by measured penalty. Every page listed scores **0/75**
except the last, which scores 20.

The governing rule for all of it: **every page must hold a topic no neighbouring page holds.** Not
"rewrite in other words" — find what is true on this page and absent from its neighbours.

**Why R1 is the guides wave, not areas.** All three drafts nominated themselves as first; the
numbers reverse that. The fourteen worst guides carry 2,072 penalty points, and the fourteenth (84)
still outranks the worst area page (76) and the worst compare page (73). R1 is also the only wave
that is mostly deletion rather than research: the defect is one welded "underwriting voice" clause
repeated 16–123 times per file. Removing it moves the hedging pool (8,997 points) and heading-echo
(3,045) without a single new fact. And it deletes the corpus's sentence donors first — `ifza ×
meydan` at 509 shared sequences is four times the next pair — so every later wave's duplication
measurement is clean instead of polluted by scaffolding that was going to be deleted anyway.

An adversarial pass over the plan found **nine collisions of argument shape** between pages about
different subjects, which is the failure mode that actually produces identical prose, and rewrote
**12 theses** before any writing starts. The clearest: three separate pages had resolved to the same
punchline, "there is no regulator behind the service charge"; and two pages in adjacent waves had
been assigned to explain the same number.

### R1 — the fourteen worst guides (penalties 315 to 84)

**`guides/oman-property-foreigner-living`** — score 0, template — worst page in the corpus at 315 penalty points. Self-repetition 45% of internal 8-grams (gate, cap 35), duplicated-text 13.1% shared with t

> Title class, not location: a sale of non-ITC Omani land to a foreigner is void rather than merely risky, and the MOHUP register is read — freehold ITC vs 99-year usufruct vs GCC-national title — before a reservation fee leaves the account.

**`guides/golden-visa-renewal-requirements-uae`** — score 0, template — 273 points. Self-repetition 40% (gate, cap 35), 25 heading-echo hits (every H2 on the page), hedging 14.5 per 1000 against a 1.9 hand-writt

> Renewal day is a register snapshot: the AED 2M test is re-run on current registered value against an unbroken deed at the filing date, so a sell-and-replace gap, a unit still on Oqood at handover, or a bank revaluation below AED 2M kills a file that qualified cleanly at grant.

**`guides/saudi-property-designated-zones-explained`** — score 0, template — 246 points. Self-repetition 33% (gate), duplicated-text 7.6% across three Saudi files, 19 heading-echo hits, template-family, echo-openers 

> How you prove a specific plot sits inside a designated zone: the REGA boundary-and-phase register, the property-type carve-outs that survive inside an approved zone, and the Makkah/Madinah exclusion no future phase release will lift.

**`guides/oman-itc-visa-living`** — score 0, template — 209 points. Self-repetition 41% (gate), 16 heading-echo hits, echo-openers gate. Seventeen of eighteen sections open with the byte-identica

> The ITC owners' association as the thing you actually live under: five-year service-charge ledgers, Arabic-only AGM minutes, jetty and facade special levies, and gate and pet house rules that bind you before the SPA — private governance in a market with no strata-law equivalent.

**`guides/living-al-ain`** — score 0, template — 166 points. Self-repetition 23%, 16 heading-echo hits, hedging 10.1 per 1000, echo-openers gate. The page has real reporting (Jebel Hafeet 

> Al Ain is a separate labour market with its own catchment: the Al Buraimi crossing is a weekday amenity and neither the Abu Dhabi nor the Dubai daily commute closes on the arithmetic, so an Al Ain purchase is underwritten on Al Ain employment or it is not underwritten at all.

*Thesis corrected by the adversarial pass.* collision D8, verified and larger than the register states. C3 names two pages sharing the employer-housing-allowance mechanism; grep returns 10 files carrying 'housing allowance', including two further in-plan pages the register does not mention: guides/oman-

**`guides/ifza-company-setup`** — score 0, duplication — 143 points and the largest cannibal pair in the corpus: 509 shared 9-grams with meydan-free-zone-setup, 25.4% of the file, tripping the 

> What a non-Dubai jurisdiction on the licence costs downstream: Fujairah documents at bank onboarding and client procurement, establishment-card friction against a Dubai working address, and a channel-partner-only sales model with no published direct price list — so the quote you get is a partner's margin, not a tariff.

**`guides/saudi-family-visa`** — score 0, template — 141 points. Self-repetition 25% (gate), hedging 19.5 per 1000 (ten times the hand-written baseline), template-family across 6 shared skelet

> The dependent file fails on housing and paper, not salary: an Ejar lease registered in the sponsor's own name (or an employer housing letter with matching tenant details), plus a separate legalisation chain per child that must start 8-12 weeks before the family flies.

**`guides/meydan-free-zone-setup`** — score 0, duplication — 136 points, the other half of the 509-gram pair. Duplicated-text 22.9%, duplicated-volume 553 sequences, mass-duplication gate, hedging 

> What the Dubai emirate address on an MFZ licence actually buys: marketplace and payment-gateway seller verification, multiple activities bundled on one licence, and bank recognition — priced honestly against a licence that is otherwise IFZA-equivalent on cost and speed.

**`guides/schools-near-jvc`** — score 0, template — 133 points. Self-repetition 24% (gate), hedging 18.6 per 1000, template-family across 6 skeletons shared with abu-dhabi-vs-dubai-families a

> JVC has no school inside its own boundary: every seat is an out-of-district crossing over Hessa Street or Al Khail into JVT, Al Barsha South or Sustainability City, and that crossing sets the bus zone, the fee band and the 07:30 Sunday number.

**`guides/abu-dhabi-vs-dubai-families`** — score 0, template — 122 points on the longest file in the set (4,850 words). Self-repetition 19% (gate), hedging 19.2 per 1000, template-family 15 points acros

> Seat portability between two regulators: an inter-emirate move forfeits the KHDA or ADEK seat, sibling priority and deposit because none transfers, so the school calendar — not the job start date — sets the move window.

**`guides/dubai-property-for-american-buyers`** — score 0, duplication — 97 points and the head of the nationality template family: template-family 33 across 13 shared skeletons, duplicated-text 6.4%, echo-ope

> The only pegged buyer: at AED 3.6725 a Dubai price is a fixed USD number, so there is no FX timing decision at all and the binding gate moves to the US side — outbound-wire and correspondent screening into a DLD trustee account, and a mortgage underwritten on USD income with no UAE credit file behind it.

**`guides/dubai-property-for-indian-buyers`** — score 0, duplication — 89 points. Template-family 27 across 11 shared skeletons, duplicated-text 6.5%, duplicated-volume 159 sequences, 3 heading-echo hits. Ca

> The LRS calendar for a resident Indian buyer: a USD 250,000 per-person financial-year ceiling plus 20% TCS above the threshold forces an off-plan payment plan to be mapped across April-March windows and across family members before the MOU is signed, not after.

**`guides/qatar-property-buyer-relocation`** — score 0, template — 87 points. Self-repetition 19% (gate), hedging 13.5 per 1000. The unpunctuated tail 'we keep those planning figures on one spreadsheet Revi

> The deed and the residence are sequential, not simultaneous: MOI property residence is a separate filing that cannot begin while an employer QID is live, so there is a measurable window in which you own Qatari property and hold no right of residence from it — and that window, not the SPA date, is what the rent-first period is actually covering.

*Thesis corrected by the adversarial pass.* collision D6, the other half of the inverted assignment. The drafted thesis ('sponsorship collision: an employed expat's QID is held by the employer while MOI property residence is a separate sponsorship') is the same argument as golden-visa-vs-dubai-residence

**`guides/sharjah-vs-dubai-rent`** — score 0, fragmentation — 84 points, echo-openers gate, 10 heading-echo hits, hedging 11.0 per 1000. The deeper problem is topical: across 32 sections it re-run

> The renewal instrument, not the headline rent: Dubai sets a statutory increase band off the RERA index against an Ejari contract while Sharjah has no index and registers tenancies with the municipality — so years two and three, the cheque count, and bachelor-versus-family stock rules decide the real three-year cost.


### R2 — the areas collection (penalties 76 to 59)

**`areas/al-maryah-island-property-investment`** — score 0, duplication — 76 penalty points, hard-gated at 35 by self-repetition (8% of the article's 8-word sequences repeat between its own sections, worst in t

> Al Maryah is the one address in the UAE where the tenant, the counterparty and possibly the court are all inside ADGM: English common law and ADGM Courts, not the Abu Dhabi Rental Dispute Committee, decide what an eviction, a rent cap or a corporate lease covenant is actually worth here.

**`areas/damac-hills-property-investment`** — score 0, penalties — 75 points. Template-family -15 (7 sentences share a skeleton with 3+ other articles, e.g. 'See Off-Plan Property Dubai Guide.'), implausib

> At brand-licence renewal the villa owner has no seat: DAMAC and the brand renegotiate the licence that the community name, the service standard and the resale premium all rest on, and owners learn the outcome as a changed fee or a de-branding notice rather than as a vote.

*Thesis corrected by the adversarial pass.* collision D5, unlinked across two register entries. This page is tagged C9 while freehold-vs-leasehold-uae and khalifa-city are tagged C13, so nothing in the register connects them — yet the drafted thesis says the page 'follows one licence to expiry through r

**`areas/al-hamra-village-property-investment`** — score 0, duplication — 72 points, hard-gated at 35 by self-repetition at 12%, the worst intra-file repetition in the collection. The same bolted-on tail ('we u

> Al Hamra's service charge carries no reserve-fund escrow and no third-party audit: fifteen-year-old resort capex — lagoon dredging, facades, chiller replacement — is recovered by ad-hoc levies on whoever owns at the time, so the AED/sq ft line tracks the developer's works programme rather than any published schedule.

*Thesis corrected by the adversarial pass.* collision D2, verified. The drafted thesis closes on 'which is what the 8-9% listing versus 4.5% VPI gap is actually measuring', while compare/rak-vs-dubai-rental-yield is separately assigned to explain that same divergence. Two pages, one explanandum, adjacen

**`areas/mudon-property-investment`** — score 0, penalties — 71 points. Hedging -25 at 16.6 hedge words per 1000, the worst of the twelve; self-repetition -13 (6%, worst in the worked-townhouse-model

> Mudon Al Ranim hands over inside the old phase's Ejari renewal window: an incumbent landlord renegotiates a renewal in the same quarter that a brand-new unit at launch price with a developer payment plan enters the same postcode, so the renewal month — not the yield — is where the phase overlap is priced.

*Thesis corrected by the adversarial pass.* collision D4. The drafted thesis ('the new phase competes directly against the old phase's renewals under a single brand name while running separate community accounts') is mbr-city's thesis at smaller scale — one name over heterogeneous stock, therefore a wro

**`areas/motor-city-property-investment`** — score 0, duplication — 70 points, hard-gated at 35 by self-repetition at 11%. Duplicated-text -6: 3.8% of its 9-word sequences appear in three other files, and

> Motor City's chilled water belongs to Emicool, the developer's own cooling JV, not to Empower and not to the owners association — a capacity charge that bills the owner straight through the void, which is where the advertised 7-8.5% gross actually goes.

**`areas/al-raha-beach-property-investment`** — score 0, template — 66 points. Template-family -18 is the worst in the collection (8 sentences share a skeleton with 3+ other articles, e.g. 'See Abu Dhabi Pro

> On Al Raha the owners-association manager, the facilities contractor and the retail landlord are one corporate group, so the line items in the OA budget are related-party prices — and what an owner can actually check is the contract chain behind each line, not the headline AED/sq ft rate.

*Thesis corrected by the adversarial pass.* collision D1. As drafted the thesis rests on 'Abu Dhabi has no Mollak escrow', which is al-hamra-village's spine ('RAK has no Mollak') and oman-itc-visa-living's ('no strata-law equivalent'). Three of the six C1 pages resolve to one punchline: no regulator sta

**`areas/downtown-dubai-property-investment`** — score 0, penalties — 66 points. Hedging -26 at 17.2 hedge words per 1000. Two heading-echoes, the damaging one being 'What does the Burj Khalifa view premium a

> The Burj view is a premium with no easement behind it — Downtown is the one Dubai district where the party that sold you the sightline still owns the unbuilt plots that can close it, and this page names those plots.

**`areas/al-reem-island-property-investment`** — score 0, duplication — 65 points. Hedging -21 at 14.3 per 1000, duplicated-text -5 (3.6% of 9-grams shared with three files), self-repetition -5, and two headi

> Three master developers laid one island — Marina Square (Tamouh), Shams (Sorouh, now Aldar) and Najmat (Reem Developers) — so 'the Al Reem service charge' is three separate regimes, and which one bills you depends on whose plot your tower stands on.

**`areas/amwaj-islands-property-investment`** — score 0, template — 63 points. Hedging -21 at 14.6 per 1000, self-repetition -13 (6%, worst in the schools section), duplicated-text -5 (3.6% across three file

> Amwaj bills a landlord three times — owners-association service charge, marina or lagoon levy, and a separately metered chiller cap — and only the first line ever reaches a yield model, which is the entire distance between the page's 6.3% gross and 4.9% net.

**`areas/dubai-sports-city-property-investment`** — score 0, penalties — 62 points, hard-gated at 45 by echo-openers: six separate sections restate their own heading rather than answer it, and openers score 5/20

> Sports City is the only Dubai freehold district still carrying unbuilt and stalled-since-2009 plots inside its own master plan: what a given tower rents and how fast it exits is set by the plot next door, not by the district average.

**`areas/jbr-property-investment`** — score 0, penalties — 60 points. Implausible-precision -9 (4.26% net, a two-decimal figure appearing nowhere else and in no registry), heading-echo on the openi

> In JBR the value of your flat is voted on: each cluster's owners association decides short-term letting by AGM, a 25-30% quorum is enough to carry it, and your neighbours can move your unit 8-15% while you are not in the country.

**`areas/dubai-harbour-property-investment`** — score 0, penalties — 59 points. Hedging -18 at 13.2 per 1000, self-repetition -12 (6%, worst in the opening price-and-yield snapshot), heading-echo on the shar

> A Dubai Harbour tenancy is two contracts with two counterparties — the flat from the owner, the berth from the marina operator at a separately quoted rate — so a landlord advertising one rent is quoting half the product and pricing a yield on the half that conveys.

*Thesis corrected by the adversarial pass.* collision D5 and a factual error in the plan's evidence. The page's notHeldBy asserts 'No in-plan collision: it is the only page in the plan whose subject is an asset that does not convey with title.' That is false: khalifa-city's musataha is a right over land


### R3 — the compare collection (penalties 73 to 50)

**`compare/freehold-vs-leasehold-uae`** — score 0, penalties — 73 points, the worst in the compare collection, hard-gated at 35 by self-repetition (26 points), plus hedging 18 and duplicated-text 9. Th

> Freehold versus leasehold is decided by a date, not a label: leasehold costs you nothing until (remaining term minus your intended hold) falls below the term a UAE bank will still lend against, at which point your exit buyer is cash-only and the discount is not 5-15% but whatever a cash buyer offers — so a 1999-vintage 99-year lease and a 1979 one are different asset classes with the same name.

**`compare/rak-vs-dubai-rental-yield`** — score 0, duplication — 60 points. Heading-echo 15, hedging 20, stamped-figure 24, self-repetition 1. The longest file in the wave (3,661 words, 17 H2s) and the

> Dubai and RAK trade a rent ceiling against a price floor: Dubai's Ejari registration plus the RERA index caps what you can raise at renewal but produces the public comparable that lets a buyer's bank value your unit in a week, while RAK has neither, so rent resets freely and there is no comp set at exit — which is the actual cause of the 90-180 day marketing window, not thin demand.

**`compare/dubai-vs-oman-rental-yield`** — score 0, duplication — 57 points. Self-repetition 9, hedging 24, stamped-figure 24, structure 12/15. The same paragraph (Dubai 7-9% gross / 5-7% net vs Oman IT

> In an Oman ITC the right to let is a permission held by the master operator and MOCI, not a default of ownership — some zones are long-let only, and where short-stay is allowed the operator sets the rate — so Oman's yield is contingent on a counterparty you do not control, while Dubai's is contingent on a fee you pay (DET holiday-home permit, AED 1,520): you are a landlord in Dubai and usually a unit-holder in an operator-run pool in Oman.

**`compare/saudi-arabia-vs-uae-golden-visa`** — score 0, template — 56 points and the most structurally broken file in the segment: duplicated-text 20, template-family 12, stamped-figure 24, evidence and str

> In the UAE the property is the visa — one AED 2M asset does both jobs — while in Saudi Arabia they are two separate capital commitments, a Law M/14 designated-zone purchase that grants ownership only plus a Premium Residency investment track near SAR 4M that grants status; so a buyer comparing AED 2M against SAR 4M is comparing one cheque against two, and the UAE's advantage is structural rather than a price gap.

**`compare/uae-vs-oman-property-investment`** — score 0, template — 56 points plus structural corruption. Hedging 18, self-repetition 14, stamped-figure 24, structure 9/15, evidence 11/15. Section bodies are

> An Oman ITC unit can only be sold to another foreigner who wants an ITC unit, because ITC pricing was set for foreign buyers and is detached from the Muscat market Omanis actually buy in, whereas UAE freehold resells into UAE residents, GCC nationals and foreign investors at once — the buyer pool at exit is a fraction of the pool at entry in Oman and the same pool in the UAE, which is the structural reason for 12-month marketing windows.

**`compare/emaar-vs-damac`** — score 0, duplication — 56 points, gated at 45 by echo-openers, openers 6.3/20, heading-echo 20, hedging 12, stamped-figure 24. Two 900-word sections titled 'Ho

> Emaar files quarterly on the DFM, so the balance sheet standing behind three years of your off-plan instalments is observable before you wire; DAMAC does not, so on the DAMAC side the counterparty risk is unobservable and a backward-looking delivery percentage is the only proxy you get — the choice is between a risk you can read and a risk you can only average.

**`compare/bahrain-vs-dubai-investment`** — score 0, duplication — 55 points. Hedging 24, stamped-figure 24, self-repetition 2. The page's core table (1BR ticket, gross yield, acquisition stack, days on 

> Bahrain rental income is derived demand from Saudi Arabia — Causeway commuters, Saudi weekenders, and a banking sector that exists to service Saudi capital — so a Bahrain unit is a short position on Vision 2030's domestic build-out while a Dubai unit at the identical 7% gross is a long position on the same programme: two assets with the same yield and opposite exposure to one event.

**`compare/dubai-vs-sharjah-property-investment`** — score 0, penalties — 54 points, and openers 3.2/20, the worst opener score in the collection: nearly every section restates its H2 as its first clause. Heading

> Sharjah's foreign-owned stock sits in master plans still under construction — Aljada, Al Zahia, Masaar, Maryam Island — so at resale your competition is the developer's next phase with a payment plan you cannot match, while Dubai's fringe freehold (JVC, Discovery Gardens, Sports City) is post-developer, where you compete only against other owners; that, not tenant demand, is what a 5-15% Sharjah liquidity discount actually pays for.

**`compare/abu-dhabi-vs-dubai-investment`** — score 0, duplication — 54 points, openers 5.1/20. Heading-echo 15 (sections restate their own H2 before answering), hedging 15, stamped-figure 24. Its content 

> Abu Dhabi rent is priced against employer housing-allowance bands (ADNOC, Mubadala, ADGM, government), so it has a floor a Dubai unit does not have and a ceiling a Dubai unit does not have — you cannot re-price to market on turnover; Dubai rent is priced against tenant willingness-to-pay, so the buyer choosing Abu Dhabi is buying a rent floor by selling the rent upside.

**`compare/qatar-vs-uae-residency`** — score 0, fragmentation — 50 points, hedging 25 (the highest hedge load in the collection), heading-echo 5, stamped-figure 20, rhythm 1.9/8. 21 H2s across 3,281

> In Qatar the residency-qualifying zone list and the family's liveable geography are the same four postcodes — Pearl, Lusail, West Bay Lagoon, Msheireb — so one purchase simultaneously fixes your school run, your commute, your tenant pool and your resale pool; in the UAE those are four independent variables across dozens of AED 2M catchments, which is why 'AED 2M versus USD 200,000' is not a price comparison.


### R4 — twins and registry-driven pages (penalties 83 to 20)

**`guides/golden-visa-vs-dubai-residence-visa`** — score 0, penalties — 83 points, the highest remaining zero in the corpus after R1's fourteen. Self-repetition 26 (gate), hedging 24, duplicated-text 9, stamped

> Who holds your residence decides what survives a termination: an employer-sponsored visa takes the Emirates ID, the bank relationship and the mortgage down with the payroll, while a self-sponsored Golden Visa makes the property rather than the employer the thing carrying the family.

*Thesis corrected by the adversarial pass.* collision D6, an inverted assignment verified by grep. The plan gives 'who holds your status' to qatar-property-buyer-relocation and confines this page to 'the handover moment'. The material runs the other way: this file carries 22 'employer', 11 'self-sponsor

**`guides/dubai-property-for-pakistani-buyers`** — score 0, template — 82 points and the corpus's only malformed-output gate (cap 40). Self-repetition 25, hedging 19, template-family 9, heading-echo 5, stamped-

> Which family member may lawfully be the buyer decides whose name reaches the deed: State Bank of Pakistan restrictions on resident outward investment make the practical purchaser a non-resident Pakistani, so title, the mortgage application and any Golden Visa attach to someone other than the person funding the purchase.

*Thesis corrected by the adversarial pass.* collision D7. The drafted thesis ends 'so the page sequences the purchase around the source of funds rather than around the property', which is the same scheduling claim as american's wire screening and german's pre-wire document file. Three of five nationalit

**`guides/dubai-property-for-british-buyers`** — score 0, duplication — 78 points and the 112-shared-9-gram twin (6.0%) of R1's american page. Duplicated-text 20, template-family 15, heading-echo 15, stamped-

> The deliberate opposite of the American page: sterling floats against a pegged dirham, so a three-year off-plan payment plan is an unhedged GBP/AED position and the instalment schedule — not the purchase price — is the currency decision, which is why a forward or a staged conversion is part of underwriting rather than treasury housekeeping.

**`guides/dubai-property-for-german-buyers`** — score 0, template — 77 points and template-family 33, the highest template-family score in the corpus. Duplicated-text 12, hedging 8, stamped-figure 24. Cannib

> The German constraint is continuing rather than transactional: a Dubai property is a reportable foreign holding for as long as it is owned, so the obligation this page schedules starts at completion and recurs annually, which is a different planning object from any pre-purchase document pack.

*Thesis corrected by the adversarial pass.* collision D7, verified. C10 splits five money rails on paper, but three of the drafted theses describe one event: american's 'outbound-wire and correspondent screening', this page's 'the source-of-funds file a German bank builds before it will release a six-fi

**`areas/dubai-production-city-property-investment`** — score 0, penalties — 56 points, echo-openers gate, heading-echo 20, hedging 12, stamped-figure 24 (at the cap), openers 8.6/20. It is in R4 by obligation rathe

> The district was built as staff housing for one licensed industry, so its rent is a single sector's payroll: media and printing tenants share an employer type and a salary band, and a contraction in that one cluster moves occupancy and achievable rent together rather than in sequence.

*Thesis corrected by the adversarial pass.* collision D3, a direct self-contradiction inside the plan. C11 states 'R4 jlt owns free-zone LAND, not a company licence', and the plan then writes this page a thesis whose core is 'residential stock inside a free-zone-administered master community... the comm

**`areas/saadiyat-island-property-investment`** — score 0, penalties — 56 points, registry-driven. Hedging 19, stamped-figure 24 (at the cap), template-family 6, self-repetition 5, duplicated-text 2, openers 1

> Each dated institutional opening on Saadiyat delivers a countable resident cohort — curatorial and operations headcount plus hotel keys — so demand arrives here in identifiable steps tied to a state commitment, and the leasing question is which opening a given handover lands against.

*Thesis corrected by the adversarial pass.* vagueness, question 2. 'Underwritten against a government capital-projects calendar, not a developer launch calendar' is a frame rather than a claim: it never states why a museum milestone moves a rent, so it does not tell a writer what belongs in section four

**`areas/mbr-city-property-investment`** — score 0, penalties — 56 points, registry-driven. Hedging 27 (the highest of the remaining area zeros), heading-echo 5, stamped-figure 24 (at the cap), openers 

> MBR City is a portal label, not a community: several separately-branded sub-developments by different developers share one search term, so the average price and yield your valuation leans on is drawn largely from stock you do not own and cannot be repriced against.

**`areas/dubai-islands-property-investment`** — score 0, penalties — 54 points, echo-openers gate, heading-echo 20, hedging 10, stamped-figure 24 (at the cap), openers 8.4/20. Registry-driven and sequence-de

> On reclaimed land the infrastructure sequence is the rent curve: the beach, the road link and the hotel operators arrive on a published phase schedule, so an early handover buys a completed title on a construction site and the date of each phase — not the district average — sets what the unit rents for in its first three years.

**`areas/khalifa-city-property-investment`** — score 0, penalties — 52 points, registry-driven. Hedging 24, stamped-figure 24 (at the cap), self-repetition 4, openers 15.0/20 — no gate and no structural cor

> Musataha is a time-limited development right over land you do not own, sold across Abu Dhabi's private compounds as freehold-equivalent — this page is the corpus's sole owner of what the instrument actually grants and how its remaining term reads on the DMT register.

**`areas/manama-property-investment`** — score 0, penalties — 52 points, registry-driven and the cleanest profile in the wave: hedging 28 and stamped-figure 24 (at the cap) and nothing else — no headi

> Bahrain's utility tariff has a class, and the class follows the occupier: an expat-let flat is billed on a different EWA band from an owner-occupied one and the per-property subsidy position changes with tenancy, so who lives in the unit changes the running cost before it changes the rent.

**`areas/jlt-property-investment`** — score 0, penalties — 50 points, echo-openers gate, heading-echo 20, hedging 6, stamped-figure 24 (at the cap), openers 6.2/20 — the second-worst opener score a

> JLT is land inside a free zone: registration, tenancy and the tenant's own trade licence run through DMCC rather than through the DLD and Ejari alone, so the tenant pool is defined by who can hold a DMCC licence and the cluster is the unit of administration.

**`compare/uae-vs-qatar-property-investment`** — score 20, fragmentation — the only page in the plan that does not score zero, and the only one whose whole gap is a single gate: it is capped at 20 by no-sectio

> Qatar's foreign-ownership market is small enough to be a list rather than a market: the freehold zones are a handful of master-planned districts with a single-digit developer count, so entry price, tenant pool and exit pool are all set by supply the state and Qatari Diar release on schedule — the opposite of a UAE market where thousands of private owners set the clearing price.



## 6. The honest weakness, and the one thing I need from you

**No human-written prose exists anywhere in this repository.** The root commit is a squashed import
of all 612 content files, and every one of the 593 carries `author: "Invest Gulf Editorial"`. The
`good` set is therefore four articles written by the same kind of agent whose output this rubric
will grade. That is marking your own homework, and it has three consequences:

1. The score is a **relative** separator — "this page sits closer to the `745d602` end than to the
   August batch" — not an absolute definition of good writing.
2. `good.min` rests on **four files**. One weak section in one of them flips calibration.
3. Three articles from that same batch had to be **demoted out of the good set**, because they are
   mutually templated: `by-product of a sound purchase` appears verbatim in three of them, `puts
   renewal at risk` in two. Those were pages I wrote, and they reproduced the corpus's own failure
   in miniature.

**The ask: 15–20 files rated by hand.** Stratified across the score distribution, rated 1–5, blind
to filename and score. That produces the one thing this labelling structurally cannot — a positive
class not authored by the grader. It is an hour of reading and it is the difference between a
scorer that measures quality and one that measures distance from a known-bad commit.

Until that exists, this scorer should not be the only gate on new work.
