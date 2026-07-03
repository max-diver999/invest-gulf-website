import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function showOddLines(filepath) {
  const fullPath = join(__dirname, '..', filepath);
  const content = await readFile(fullPath, 'utf-8');
  
  const parts = content.split('---');
  if (parts.length < 3) return;
  
  const body = parts.slice(2).join('---');
  const lines = body.split('\n');
  
  console.log(`\n${filepath}:\n`);
  
  lines.forEach((line, idx) => {
    const boldMatches = [...line.matchAll(/\*\*/g)];
    if (boldMatches.length > 0 && boldMatches.length % 2 !== 0) {
      console.log(`Line ${idx + 1}: (${boldMatches.length} **)`);
      console.log(`  ${line}`);
      console.log('');
    }
  });
}

await showOddLines('src/content/guides/oman-property-foreigner-living.mdx');
await showOddLines('src/content/guides/ras-al-khaimah-property-investment-guide.mdx');
