import { readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const filesToFix = [
  'src/content/guides/dubai-tenant-eviction-rules-rera.mdx',
  'src/content/guides/oman-property-foreigner-living.mdx',
  'src/content/guides/ras-al-khaimah-property-investment-guide.mdx',
  'src/content/guides/uae-visa-property-investor-750k.mdx',
];

async function fixFile(filepath) {
  const fullPath = join(__dirname, '..', filepath);
  let content = await readFile(fullPath, 'utf-8');
  let original = content;

  // Fix 1: Remove ** from end of numbered list items (legal/technical citations)
  // E.g., "1. Law No. 26 of 2007**: text" -> "1. Law No. 26 of 2007: text"
  content = content.replace(/^(\d+\. [^:]+)\*\*:/gm, '$1:');
  
  // Fix 2: Remove ** from "Section label: **" pattern at start of lines
  // E.g., "Parent hubs: ** [link]" -> "Parent hubs: [link]"
  content = content.replace(/^([A-Z][a-z ]+): \*\* /gm, '$1: ');
  content = content.replace(/^(Short answer|The honest [^:]+|The [A-Z][a-z]+ thesis): \*\* /gm, '$1: ');
  
  // Fix 3: Remove ** from end of FAQ questions
  // E.g., "Can foreigners buy property?** " -> "Can foreigners buy property?"
  content = content.replace(/^([A-Z][^?\n]+\?)\*\*  $/gm, '$1');
  
  // Fix 4: Remove ** from "Scenario X: ** " patterns
  // E.g., "Scenario A: ** text" -> "Scenario A: text"
  content = content.replace(/^(Scenario [A-Z][ —][^:]+): \*\* /gm, '$1: ');
  
  // Fix 5: Remove ** from "Related reading: **"
  content = content.replace(/^Related reading: \*\* /gm, 'Related reading: ');
  
  // Fix 6: Remove trailing ** from list item labels
  // E.g., "- Company name**, description" -> "- Company name, description"
  content = content.replace(/^(- \*\*[^*]+)\*\*, /gm, '$1, ');
  content = content.replace(/^(- [^*]+)\*\*, /gm, '$1, ');
  
  // Fix 7: Fix "label**: text" → "label: text"
  content = content.replace(/^(Corporate demand|Real estate brand signal|The downside risks): \*\* /gm, '$1: ');
  
  // Fix 8: Fix section headers that end with **:
  // E.g., "Tenant defences:**" -> "Tenant defences:"
  content = content.replace(/^([A-Z][a-z ]+)\*\*:$/gm, '$1:');
  content = content.replace(/^(Incorrect process \([^)]+\))\*\*:$/gm, '$1:');
  
  // Fix 9: Remove ** from table cells (careful - preserve actual bold content)
  // E.g., "| Total )** |" -> "| Total |"
  content = content.replace(/\)\*\* \|/g, ') |');
  
  // Fix 10: Remove ** from numbered outline items
  // E.g., "1. Title and eligibility clarity**: text" -> "1. Title and eligibility clarity: text"
  content = content.replace(/^(\d+\. [^:]+clarity|liquidity|depth|case|optionality)\*\*:/gm, '$1:');
  
  // Fix 11: Remove "Choose ... **" orphaned patterns
  content = content.replace(/^(Choose [^*]+)\*\* if/gm, '$1 if');
  
  // Fix 12: Fix specific TldrBlock issue with leading **
  content = content.replace(/text=\{"\*\* RAK/g, 'text={"RAK');
  content = content.replace(/text=\{"\*\* Dubai/g, 'text={"Dubai');

  if (content !== original) {
    await writeFile(fullPath, content, 'utf-8');
    console.log(`✓ Fixed ${filepath}`);
    return true;
  }
  
  console.log(`  ${filepath}: no changes`);
  return false;
}

async function main() {
  console.log(`Final bold pattern fixes for ${filesToFix.length} files...\n`);
  
  let fixed = 0;
  for (const file of filesToFix) {
    try {
      const wasFixed = await fixFile(file);
      if (wasFixed) fixed++;
    } catch (err) {
      console.error(`✗ Error: ${file}:`, err.message);
    }
  }
  
  console.log(`\nFixed ${fixed} files.`);
}

main();
