#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const ROOT = decodeURIComponent(new URL('../src/content/guides/', import.meta.url).pathname);
function ins(raw, b) {
  for (const m of ['**Related reading:**', '*Invest Gulf Editorial —', '*Invest Gulf Editorial*'])
    if (raw.includes(m)) return raw.replace(m, b.trim() + '\n\n' + m);
  return raw + '\n\n' + b;
}
const P = {
  'dubai-production-city-property-investment': `Production City investors should track **Dubai Media City and Tecom occupancy** quarterly — studio demand correlates with advertising and production hiring cycles more than city-wide tourism.`,
  'motor-city-property-investment': `Before closing, request **Mollak service charge statement** for the exact building and compare with Green Community townhouse averages — a 20% SC surprise erases a full year of net yield on a AED 1.6M townhouse.`,
  'the-valley-dubai-property-investment': `Compare handover snagging reports with [Mudon](/guides/mudon-property-investment/) owners' groups online — DP phase quality varies more than marketing renders suggest.`,
  'bahrain-driving-license': `
## Reference checklist — print before GDT visit

- [ ] CPR original + copy  
- [ ] Passport + visa page  
- [ ] Home licence (not expired)  
- [ ] Embassy translation if required  
- [ ] Eye test certificate (dated)  
- [ ] Passport photos (current spec)  
- [ ] BHD cash / card for fees  
- [ ] Employer letter if PRO requires  
- [ ] Insurance quote ready for plate registration  
- [ ] Causeway endorsement requested if EP commute  

Store digital copies in cloud folder shared with spouse — second driver setup duplicates the stack within 30 days.`,
  'bahrain-family-visa': `
## Family visa document folder (physical + scan)

Keep one ring binder: marriage cert (attested), birth certs (attested), passports, CPR copies, lease registration receipt, school offer letters, insurance cards, LMRA receipts. Border re-entry with dependants fails when **sticker page** not updated — photo passport page after every visa change.

Spouse employment: if spouse later obtains own work visa, dependant status may need cancellation first ** (confirm LMRA)** — plan career moves sequentially not in parallel.`,
  'bahrain-healthcare-guide': `
## Annual health admin calendar

| Month | Task |
|---|---|
| January | Download new insurance card; verify network PDF |
| March | Dental check (usually out-of-pocket) |
| June | Paediatric well visit before school medical form |
| August | Renew prescriptions before travel |
| November | Flu vaccine clinic (hospital or pharmacy) |

Keep **all bills 24 months** for tax and insurance disputes — photo receipts same day.`,
  'bahrain-saudi-bridge-commute': `
## Commute decision scorecard

Score 0–2 each; if total **10+**, Bahrain housing likely works:

1. EP office within 45 min off-peak from Amwaj/Seef  
2. Employer allows flexible start 07:30+  
3. KSA insurance endorsement obtained  
4. Spouse job Bahrain-based or remote  
5. Children school in Bahrain not EP  
6. You tolerate Sunday morning queues  
7. Second car not required for spouse  
8. Fuel budget under BHD 150/month acceptable  

If score under 6, rent EP apartment 3 months before buying Bahrain freehold for commute logic.`,
  'bahrain-vs-dubai-living': `
## Relocation cost one-offs (often forgotten)

| Item | Bahrain | Dubai |
|---|---|---|
| Shipment 20ft container | USD 2–4K | USD 2–4K |
| Car import / buy | BHD 3–8K | AED 15–40K |
| School registration | BHD 500–2K | AED 2–5K |
| Utility deposits | BHD 50–100 | AED 2–5K |

Amortise over 36 months when comparing monthly COL — Bahrain wins on rent but not always on setup friction.`,
  'living-amwaj-islands': `
## Amwaj first-month setup sequence

Week 1: CPR address update · EWA account · car registration or lease.  
Week 2: GP registration · school bus form · marina gate pass if applicable.  
Week 3: Bank standing orders for rent and SC · causeway tag if commuting.  
Week 4: Join community Facebook/WhatsApp groups for plumber and AC referrals — island trades book fast in August.`,
  'living-seef-bahrain': `
## Seef expat survival tips

- Gym in tower beats driving to Amwaj for consistency  
- Friday brunch noise in ground retail — mid-floor units quieter  
- Supermarket delivery saves parking wars at Seef Mall  
- Keep umbrella in car — rare downpours flood underpasses briefly  
- Learn one Arabic phrase for building security — speeds parcel delivery  

Investors: target tenants with **employer housing allowance** above BHD 800 — below that, turnover rises after first summer AC bill.`,
};
for (const [s, b] of Object.entries(P)) {
  const p = join(ROOT, s + '.mdx');
  let r = readFileSync(p, 'utf8');
  r = ins(r, b);
  writeFileSync(p, r);
  console.log(s, r.split('---').slice(2).join('---').split(/\s+/).filter(Boolean).length);
}
