import { readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Files still with odd ** count
const filesToFix = [
  'src/content/guides/dubai-tenant-eviction-rules-rera.mdx',
  'src/content/guides/oman-property-foreigner-living.mdx',
  'src/content/guides/oman-relocation-guide.mdx',
  'src/content/guides/ras-al-khaimah-property-investment-guide.mdx',
  'src/content/guides/saudi-arabia-property-foreigners-guide.mdx',
  'src/content/guides/uae-credit-score-al-etihad.mdx',
  'src/content/guides/uae-free-zone-vs-mainland.mdx',
  'src/content/guides/uae-visa-property-investor-750k.mdx',
  'src/content/guides/wynn-al-marjan-island-timeline-impact.mdx',
];

async function fixFile(filepath) {
  const fullPath = join(__dirname, '..', filepath);
  let content = await readFile(fullPath, 'utf-8');
  let originalContent = content;

  // Fix common patterns that create odd ** counts

  // Pattern 1: Remove trailing ** from parenthetical confirmations
  // E.g., "(confirm current official rules)**" -> "(confirm current official rules)"
  content = content.replace(/\(confirm current official rules\)\*\*/g, '(confirm current official rules)');
  
  // Pattern 2: Fix standalone ** before parenthetical confirmations
  // E.g., "text ** (confirm" -> "text (confirm"
  content = content.replace(/ \*\* \(confirm current official rules\)\*\*/g, ' (confirm current official rules)');
  
  // Pattern 3: Fix missing space before **
  // E.g., "hubs:**" -> "hubs: **"
  content = content.replace(/([a-z]):(\*\*)/g, '$1: $2');
  
  // Pattern 4: Fix orphaned ** at start/end of lines (not part of pairs)
  // This is tricky - need to be conservative
  
  // Pattern 5: Fix table cells with trailing **
  // E.g., "| False, most arrivals |**" -> "| False, most arrivals |"
  content = content.replace(/\|\*\*/g, '|');
  
  // Pattern 6: Fix **text ending sentence without closing
  // Look for **[text] at end of line without matching close
  // E.g., "expect **stronger cultural" (next line) -> "expect stronger cultural"
  content = content.replace(/\*\*([A-Z][a-z]+ )/g, '$1');

  if (content !== originalContent) {
    await writeFile(fullPath, content, 'utf-8');
    console.log(`✓ Fixed ${filepath}`);
    return true;
  }
  
  console.log(`  ${filepath}: no automatic fixes applied`);
  return false;
}

async function main() {
  console.log(`Fixing remaining bold patterns in ${filesToFix.length} files...\n`);
  
  let fixed = 0;
  for (const file of filesToFix) {
    try {
      const wasFixed = await fixFile(file);
      if (wasFixed) fixed++;
    } catch (err) {
      console.error(`✗ Error fixing ${file}:`, err.message);
    }
  }
  
  console.log(`\nFixed ${fixed} files. Re-run qa:corpus to verify.`);
}

main();
