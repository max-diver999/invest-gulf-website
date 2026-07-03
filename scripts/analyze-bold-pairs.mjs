import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function analyzeBoldPairs(filepath) {
  const fullPath = join(__dirname, '..', filepath);
  const content = await readFile(fullPath, 'utf-8');
  
  // Skip frontmatter
  const parts = content.split('---');
  if (parts.length < 3) {
    console.log('Invalid MDX format');
    return;
  }
  
  const body = parts.slice(2).join('---');
  const lines = body.split('\n');
  
  console.log(`\n=== ${filepath} ===\n`);
  
  let boldStack = [];
  let totalBold = 0;
  
  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const boldMatches = [...line.matchAll(/\*\*/g)];
    
    if (boldMatches.length === 0) return;
    
    totalBold += boldMatches.length;
    
    // Track opening/closing
    boldMatches.forEach((match) => {
      if (boldStack.length === 0 || boldStack[boldStack.length - 1].closed) {
        // Opening bold
        boldStack.push({ lineNum, line: line.substring(0, 80), closed: false });
      } else {
        // Closing bold
        boldStack[boldStack.length - 1].closed = true;
      }
    });
    
    // Report odd-count lines
    if (boldMatches.length % 2 !== 0) {
      console.log(`Line ${lineNum}: ${boldMatches.length} ** (ODD)`);
      console.log(`  ${line.substring(0, 100)}...`);
    }
  });
  
  console.log(`\nTotal ** count: ${totalBold}`);
  console.log(`Open bold contexts: ${boldStack.filter(b => !b.closed).length}`);
  
  // Show unclosed bolds
  const unclosed = boldStack.filter(b => !b.closed);
  if (unclosed.length > 0) {
    console.log(`\nUnclosed bold markers:`);
    unclosed.forEach(b => {
      console.log(`  Line ${b.lineNum}: ${b.line}...`);
    });
  }
}

const files = [
  'src/content/guides/dubai-tenant-eviction-rules-rera.mdx',
  'src/content/guides/oman-property-foreigner-living.mdx',
  'src/content/guides/ras-al-khaimah-property-investment-guide.mdx',
  'src/content/guides/uae-visa-property-investor-750k.mdx',
];

for (const file of files) {
  await analyzeBoldPairs(file);
}
