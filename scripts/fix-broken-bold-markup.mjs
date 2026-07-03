import { readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// List of files to fix (from qa-corpus output)
const filesToFix = [
  'src/content/areas/arabian-ranches-property-investment.mdx',
  'src/content/areas/business-bay-property-investment.mdx',
  'src/content/areas/discovery-gardens-property-investment.mdx',
  'src/content/areas/jvc-property-investment.mdx',
  'src/content/guides/abu-dhabi-adgm-setup.mdx',
  'src/content/guides/abu-dhabi-driving-guide.mdx',
  'src/content/guides/bahrain-golden-residence-property.mdx',
  'src/content/guides/bahrain-property-investment-guide.mdx',
  'src/content/guides/best-off-plan-abu-dhabi.mdx',
  'src/content/guides/best-off-plan-business-bay-dubai.mdx',
  'src/content/guides/best-off-plan-downtown-dubai.mdx',
  'src/content/guides/best-off-plan-dubai-marina.mdx',
  'src/content/guides/best-off-plan-dubai-south.mdx',
  'src/content/guides/best-off-plan-jvc-dubai.mdx',
  'src/content/guides/can-foreigners-buy-property-uae.mdx',
  'src/content/guides/dubai-cooling-off-period-off-plan.mdx',
  'src/content/guides/dubai-mainland-llc-setup.mdx',
  'src/content/guides/dubai-property-investment-guide.mdx',
  'src/content/guides/dubai-school-waiting-lists.mdx',
  'src/content/guides/dubai-tenant-eviction-rules-rera.mdx',
  'src/content/guides/dubai-vs-abu-dhabi-cost-living.mdx',
  'src/content/guides/ejari-registration-landlord-guide.mdx',
  'src/content/guides/golden-visa-2-million-aed-explained.mdx',
  'src/content/guides/gulf-property-investment-comparison-2026.mdx',
  'src/content/guides/how-to-buy-dubai-property-remotely.mdx',
  'src/content/guides/islamic-vs-conventional-mortgage-uae.mdx',
  'src/content/guides/non-resident-mortgage-dubai.mdx',
  'src/content/guides/oman-property-foreigner-living.mdx',
  'src/content/guides/oman-relocation-guide.mdx',
  'src/content/guides/qatar-property-investment-guide.mdx',
];

async function fixFile(filepath) {
  const fullPath = join(__dirname, '..', filepath);
  let content = await readFile(fullPath, 'utf-8');
  let changes = 0;

  // Fix 1: Remove leading ** from TldrBlock text attribute
  const tldrPattern = /(<TldrBlock\s+text=\{")\*\* /g;
  if (tldrPattern.test(content)) {
    content = content.replace(tldrPattern, '$1');
    changes++;
  }

  // Fix 2: Count ** occurrences in body (after frontmatter)
  const parts = content.split('---');
  if (parts.length >= 3) {
    let bodyContent = parts.slice(2).join('---');
    
    // Count ** that are not part of component attributes
    const bodyWithoutComponents = bodyContent
      .replace(/<[^>]+>/g, '') // Remove JSX tags
      .replace(/text=\{[^}]+\}/g, ''); // Remove text attributes
    
    const boldMarkers = bodyWithoutComponents.match(/\*\*/g) || [];
    
    if (boldMarkers.length % 2 !== 0) {
      console.log(`  ${filepath}: ${boldMarkers.length} ** markers (odd count) - needs manual review`);
    }
  }

  if (changes > 0) {
    await writeFile(fullPath, content, 'utf-8');
    console.log(`✓ Fixed ${filepath} (${changes} changes)`);
    return true;
  }
  
  return false;
}

async function main() {
  console.log(`Fixing broken bold markup in ${filesToFix.length} files...\n`);
  
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
