import { readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const filesToFix = [
  'src/content/guides/dubai-tenant-eviction-rules-rera.mdx',
  'src/content/guides/oman-property-foreigner-living.mdx',
  'src/content/guides/ras-al-khaimah-property-investment-guide.mdx',
  'src/content/guides/saudi-arabia-property-foreigners-guide.mdx',
  'src/content/guides/uae-visa-property-investor-750k.mdx',
];

async function fixFile(filepath) {
  const fullPath = join(__dirname, '..', filepath);
  let content = await readFile(fullPath, 'utf-8');
  let original = content;

  // Fix 1: Remove ** at end of sentences (before period)
  // E.g., "infrastructure.**" -> "infrastructure."
  content = content.replace(/\.\*\*/g, '.');
  
  // Fix 2: Remove ** at end of component attributes
  // E.g., text={"...(RDC)**, not..."} -> text={"...(RDC), not..."}
  content = content.replace(/\)\*\*, /g, '), ');
  content = content.replace(/\)\*\*\./g, ').');
  
  // Fix 3: Remove trailing ** from descriptive labels
  // E.g., "app** and" -> "app and"
  content = content.replace(/([a-z])\*\* (and|or|with|through)\b/g, '$1 $2');
  
  // Fix 4: Fix list markers ending with **: (but keep bold heading pattern)
  // Only remove if followed immediately by newline or if it's clearly orphaned
  // E.g., "Correct process: **\n" -> "Correct process:\n"
  content = content.replace(/: \*\*\n/g, ':\n');
  content = content.replace(/: \*\*$/gm, ':');
  
  // Fix 5: Remove ** from standalone label lines
  // E.g., "Facts: **" at start of line -> "Facts:"
  content = content.replace(/^([A-Z][a-z ]+ facts?): \*\*$/gm, '$1:');
  content = content.replace(/^(Correct process|Incorrect process|Related reading): \*\*$/gm, '$1:');

  if (content !== original) {
    await writeFile(fullPath, content, 'utf-8');
    console.log(`✓ Fixed ${filepath}`);
    return true;
  }
  
  console.log(`  ${filepath}: no changes needed`);
  return false;
}

async function main() {
  console.log(`Fixing remaining bold issues in ${filesToFix.length} files...\n`);
  
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
