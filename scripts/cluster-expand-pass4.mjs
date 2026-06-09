#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = decodeURIComponent(new URL('../src/content/guides/', import.meta.url).pathname);

function insert(raw, block) {
  for (const m of ['**Related reading:**', '*Invest Gulf Editorial —', '*Invest Gulf Editorial*', '---\n\n*Invest Gulf Editorial']) {
    if (raw.includes(m)) return raw.replace(m, block.trim() + '\n\n' + m);
  }
  return raw.trimEnd() + '\n\n' + block.trim();
}

const B = {
  'bahrain-driving-license': `
## Extended Q&A — GDT and daily driving

**How long is a Bahrain licence valid?**  
Renewal cycles follow GDT tariff ** (confirm current official rules)**. Set a calendar reminder 60 days before expiry — driving on expired licence invalidates insurance and employer compliance checks.

**Can I drive rental cars in Saudi with Bahrain licence only?**  
No — you need valid **Saudi entry permission** and policy endorsement. Rental agencies at Bahrain airport are not causeway-crossing solutions for EP commutes.

**What if my home country licence is not in English?**  
Use approved translator; keep translation stapled to licence copy in glove box for traffic stops.

**Are winter rains a real risk?**  
Occasional heavy rain reduces grip on Sheikh Isa Highway — reduce speed before police speed cameras; aquaplaning incidents spike on first rain day each season.

**Should children sit in front seat?**  
Follow manufacturer and GDT child-seat rules ** (confirm)** — expats often import ISOFIX seats; verify fit in smaller GCC spec cars before purchase.

**Automatic vs manual licence restriction?**  
If you test on automatic, manual rental may be blocked — choose pathway based on car you will own.

**Can employer deduct licence costs?**  
Some finance employers reimburse GDT fees — ask HR before paying; keep VAT receipts if company requires.

**Where to practice roundabouts?**  
Early Sunday morning near Isa Town training yards — avoid learning on King Fahd Causeway entry during peak.

`,

  'bahrain-family-visa': `
## Extended Q&A — dependants and LMRA

**Can I sponsor parents?**  
Rules vary by sponsor nationality and salary ** (confirm with LMRA)** — budget legal counsel before parents sell home country property.

**Newborn in Bahrain — timeline?**  
Register birth, passport, then dependant visa — hospital social worker may provide checklist; do not plan travel until passport and visa sticker complete.

**Divorce mid-visa?**  
Cancel dependant visas before final exit of primary sponsor — overstays generate fines and future entry flags.

**Can spouse work on dependant visa?**  
Generally requires **separate work permit** ** (confirm)** — do not accept informal cash work; LMRA inspections occur.

**School visa letter vs LMRA visa?**  
School letter is not immigration status — children still need proper dependant visa in passport.

**How many renewals before permanent residency?**  
Bahrain does not offer citizenship via tenure — Golden Residence is separate investment track.

**PRO agency worth it?**  
If employer PRO misses two deadlines, external PRO (BHD 100–300) cheaper than flight changes and school deposit forfeits.

**Visit visa run risks?**  
Repeated visit entries while working illegally trigger bans — always align status before starting employment.

`,

  'bahrain-healthcare-guide': `
## Extended Q&A — plans, hospitals, and bills

**Can I use NHS or home insurance while resident?**  
Residency triggers obligation to use employer plan or buy local cover — home travel policies exclude LMRA life.

**What is a co-pay?**  
Your share per visit — 10–20% common on outpatient; cap may exist on premium tiers.

**Pre-existing conditions?**  
Declare at enrollment — nondisclosure voids claims; waiting periods may apply 6–12 months.

**Emergency without card?**  
Go to ER — stabilize first; insurer retrospective pre-auth possible on premium tiers only.

**Vaccinations for school?**  
School medical forms list required jabs — paediatrician completes; pharmacy vaccines may not count for form.

**Telemedicine covered?**  
Some 2026 policies include app consults — verify if prescription pickup is local pharmacy only.

**Second medical opinion?**  
Usually out-of-pocket unless oncology rider — ask insurer case manager in writing.

**Medical loans?**  
Hospitals offer payment plans for uninsured — interest applies; avoid unless emergency.

`,

  'bahrain-saudi-bridge-commute': `
## Extended Q&A — causeway life

**Can passengers work on laptop in queue?**  
Safety and heat limit this — engines idling 45+ minutes in summer; fuel and AC wear matter.

**Best days to avoid queue?**  
Mid-week mornings toward Bahrain; Thursday toward Saudi — patterns shift on holidays.

**Accident without KSA cover?**  
Personal liability exposure on Saudi side — legal costs exceed annual insurance uplift.

**Can women drive alone across?**  
Yes — standard Bahrain licence; same queue rules.

**Motorcycle on causeway?**  
Allowed with valid bike licence and insurance — wind shear reported; not beginner route.

**Taxi cross-border?**  
Rare and expensive — not viable daily commute.

**EP salary in SAR, rent in BHD — FX?**  
Model SAR/BHD peg plus remittance fees if repatriating rent from SAR account.

**Fatigue risk?**  
Daily 90+ minute queues cause burnout — factor mental health in housing decision.

`,

  'bahrain-vs-dubai-living': `
## Extended Q&A — choosing a country

**Can I try Bahrain then move to Dubai?**  
Yes — many do after 2–3 years; factor school disruption and DLD resale on Bahrain freehold.

**Tax residency interaction?**  
Separate from immigration — UK/US still tax worldwide income unless treaty and day-count resolved.

**Alcohol and social life?**  
Bahrain licensed hotels; Dubai wider venue choice — matters for some household members more than rent.

**Pet relocation?**  
Both require import permits — Dubai pet-friendly towers more numerous.

**Car necessity score?**  
Bahrain 9/10; Dubai 6/10 if metro-adjacent.

**Language in daily life?**  
English works in both finance circles; Arabic helps landlord negotiations in Bahrain older areas.

**Summer heat comparison?**  
Both extreme; Bahrain humidity on coast; Dubai longer hot season inland.

**Final tie-breaker?**  
Where does spouse's **single best job offer** sit — commute wins over generic COL tables.

`,

  'living-amwaj-islands': `
## Extended Q&A — Amwaj daily life

**Do I need a boat?**  
No for most residents — marina lifestyle optional; berths are separate cost.

**Flood risk?**  
Lagoon engineering generally solid — ask building about 2015-era drainage upgrades in older blocks.

**Grocery delivery?**  
Talabat and Carrefour deliver — still car helps for bulk runs.

**Community fees?**  
Service charges vary lagoon vs marina — request 12-month SC statement before purchase.

**Noise from cafes?**  
Marina walk units face music until late — inspect at 22:00 Friday before lease.

**School bus from Amwaj?**  
Most international schools serve — confirm stop street, not just "Amwaj coverage."

**Power outages?**  
Rare but summer peak loads happen — tower generator spec matters for high floors.

**Resale to Saudis?**  
Causeway proximity attracts EP buyers — marketing angle for investors.

`,

  'living-seef-bahrain': `
## Extended Q&A — Seef towers

**Gym and pool in tower — worth it?**  
If SC includes, good value; if pay-per-use, compare standalone gym membership.

**Visitor parking for guests?**  
Confirm guest slots — parties in small units fail without visitor parking.

**Furnished vs unfurnished rent?**  
Furnished commands premium from single expats; families prefer unfurnished with own AC units.

**Tower security deposit?**  
Typically one month rent — register dispute photos at move-in.

**View premium?**  
Sea glimpse vs highway view — price gap 10–20%; highway louder.

**Walk to CBB?**  
Some towers genuinely 5-minute walk; others "Seef area" marketing — map pin before lease.

**Short-term Airbnb neighbours?**  
Ask building policy — some ban STR, protecting long-term tenant quiet.

**Elevator maintenance fund?**  
Older towers may levy special assessments — request HOA minutes.

`,

  'dubai-production-city-property-investment': `
## Production City — investor FAQ

**Is free zone proximity a rent guarantee?**  
No — verify employer concentration; media layoffs hit studio demand first.

**Short-term rental allowed?**  
Check building and DTCM rules — many towers restrict holiday lets.

**Metro access reality?**  
Bus to Ibn Battuta then metro — market in ad copy honestly to tenants.

**Older vs new tower SC?**  
Older may have rising sinking fund — request five-year SC history.

**Tenant nationality mix?**  
South Asian media professionals dominate — tailor maintenance response times accordingly.

`,

  'motor-city-property-investment': `
## Motor City — investor FAQ

**Autodrome event noise?**  
Race weekends affect Uptown blocks — visit during event before buying.

**Green Community HOA?**  
Townhouse cluster fees include landscaping — verify what's owner vs community.

**Comparison to Sports City?**  
Similar tenant pool — cross-shopping keeps rent caps; differentiate on school bus and park quality.

**Off-plan in Motor City?**  
Limited vs The Valley — prefer Ejari-proven blocks for first Dubai villa.

**Flood during heavy rain?**  
Dubailand drainage improved but low spots exist — inspect after storm if possible.

`,

  'the-valley-dubai-property-investment': `
## The Valley — investor FAQ

**DP vs Emaar resale discount?**  
Expect 5–8% longer days-on-market vs Emaar — price entry accordingly.

**Payment plan exit?**  
Assignment rules strict pre-handover — read SPA assignment clause before flip plans.

**Community mall delivery?**  
Retail phases lag housing — tenants drive to Town Square until local retail opens.

**Villa vs townhouse yield?**  
Townhouses often higher occupancy; villas higher ticket lower yield.

**School bus 2026?**  
Routes expanding but not Marina-depth — family tenants ask explicitly.

`,

  'schools-near-jvc': `
## JVC schools — parent FAQ

**Can we walk to any school?**  
Rare — assume car or bus; heat makes walking impractical May–September.

**KHDA rating importance?**  
Ratings update yearly — verify current not blog cache.

**Sibling priority?**  
Ask at tour — can save second child waitlist stress.

**Mid-year admission?**  
Possible if seat opens — deposit forfeited at old school.

**IB vs British from JVC?**  
IB schools fewer within 20 min — British cluster stronger.

**After-school activities?**  
Traffic to sports clubs adds 15 min — factor in tenant pitch for family units.

**Rent cap vs school fee hike?**  
School fees rise faster than RERA rent index — tenant affordability test both.

**Investor: market to school families?**  
Yes — highlight bus stop and parking in listing; yields 5–8% premia vs generic JVC 2BR.

`,
};

for (const [slug, block] of Object.entries(B)) {
  const path = join(ROOT, slug + '.mdx');
  let raw = readFileSync(path, 'utf8');
  if (raw.includes('## Extended Q&A')) continue;
  raw = insert(raw, block);
  writeFileSync(path, raw);
  const w = raw.split('---').slice(2).join('---').split(/\s+/).filter(Boolean).length;
  console.log(slug, w);
}
