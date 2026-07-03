import { readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function fixOmanProperty() {
  const file = 'src/content/guides/oman-property-foreigner-living.mdx';
  const fullPath = join(__dirname, '..', file);
  let content = await readFile(fullPath, 'utf-8');
  
  // Fix 1: "expect **stronger" -> "expect stronger"
  content = content.replace('expect **stronger cultural integration', 'expect stronger cultural integration');
  
  // Fix 2: "**Yes, in designated" -> "Yes, in designated"
  content = content.replace('Short answer: **Yes, in designated ITC zones', 'Short answer: Yes, in designated ITC zones');
  
  // Fix 3: Table cells "**False;" -> "False;"
  content = content.replace(/\| \*\*False;/g, '| False;');
  
  // Fix 4: "from **title deed" -> "from title deed"
  content = content.replace('from **title deed, never merge', 'from title deed, never merge');
  
  // Fix 5: Table "**Off-plan deposit" -> "Off-plan deposit"
  content = content.replace('| **Off-plan deposit |', '| Off-plan deposit |');
  
  // Fix 6: "**leasehold only" -> "leasehold only"
  content = content.replace('stopped, **leasehold only for foreigner', 'stopped, leasehold only for foreigner');
  
  // Fix 7: Table "**before deposit" -> "before deposit"
  content = content.replace('ROP letter **before deposit |', 'ROP letter before deposit |');
  
  // Fix 8: Remove orphaned " ** (confirm" pattern
  content = content.replace(/ \*\* \(confirm current official rules\)/g, ' (confirm current official rules)');
  
  // Fix 9: "at **~OMR" -> "at ~OMR"
  content = content.replace('at **~OMR 250K', 'at ~OMR 250K');
  
  // Fix 10: "to **HOA" -> "to HOA"
  content = content.replace('to **HOA and STR rules', 'to HOA and STR rules');
  
  await writeFile(fullPath, content, 'utf-8');
  console.log(`✓ Fixed ${file}`);
}

async function fixRakProperty() {
  const file = 'src/content/guides/ras-al-khaimah-property-investment-guide.mdx';
  const fullPath = join(__dirname, '..', file);
  let content = await readFile(fullPath, 'utf-8');
  
  // Fix 1: "thesis: ** Income" -> "thesis: Income"
  content = content.replace('The Al Hamra thesis: ** Income plus moderate', 'The Al Hamra thesis: Income plus moderate');
  
  // Fix 2: Close bold for company names in list
  content = content.replace('- **RAK Properties (listed)', '- RAK Properties (listed)');
  content = content.replace('- **RAKEEN, government-linked', '- RAKEEN, government-linked');
  
  // Fix 3: Remove ** from section headers
  content = content.replace('**RAK makes sense for:', 'RAK makes sense for:');
  content = content.replace('**RAK does not suit:', 'RAK does not suit:');
  
  await writeFile(fullPath, content, 'utf-8');
  console.log(`✓ Fixed ${file}`);
}

await fixOmanProperty();
await fixRakProperty();
console.log('\nDone. Running final corpus check...');
