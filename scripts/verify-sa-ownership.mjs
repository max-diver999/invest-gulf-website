// Verify service account as site owner in GSC via Site Verification API
// Replaces manual GSC UI flow that rejects SA emails.
//
// Usage:
//   node scripts/verify-sa-ownership.mjs --get-token   (step 1: get verification file)
//   node scripts/verify-sa-ownership.mjs --verify       (step 2: confirm after deploy)

import { GoogleAuth } from 'google-auth-library';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const KEY_PATH = join(__dirname, 'google-indexing-key.json');
const SITE_URL = 'https://invest-gulf.com/';
const PUBLIC_DIR = join(__dirname, '..', 'public');

const VERIFICATION_API = 'https://www.googleapis.com/siteVerification/v1';

async function getClient() {
  const auth = new GoogleAuth({
    keyFile: KEY_PATH,
    scopes: ['https://www.googleapis.com/auth/siteverification'],
  });
  return auth.getClient();
}

async function getToken() {
  const client = await getClient();
  const res = await client.request({
    url: `${VERIFICATION_API}/token`,
    method: 'POST',
    data: {
      site: { type: 'SITE', identifier: SITE_URL },
      verificationMethod: 'FILE',
    },
  });

  const token = res.data.token;
  console.log('Verification token:', token);

  const filePath = join(PUBLIC_DIR, token);
  writeFileSync(filePath, `google-site-verification: ${token}`);
  console.log(`Saved to: public/${token}`);
  console.log('\nNext: deploy the site, then run with --verify');
}

async function verify() {
  const client = await getClient();
  const res = await client.request({
    url: `${VERIFICATION_API}/webResource?verificationMethod=FILE`,
    method: 'POST',
    data: {
      site: { type: 'SITE', identifier: SITE_URL },
    },
  });

  console.log('Verification result:', JSON.stringify(res.data, null, 2));
  console.log('\nSA is now an Owner in GSC for invest-gulf.com');
}

const args = process.argv.slice(2);
if (args.includes('--get-token')) {
  getToken().catch((e) => {
    console.error('ERROR:', e.response?.data || e.message);
    process.exit(1);
  });
} else if (args.includes('--verify')) {
  verify().catch((e) => {
    console.error('ERROR:', e.response?.data || e.message);
    process.exit(1);
  });
} else {
  console.log('Usage:\n  --get-token  Get verification file\n  --verify     Confirm ownership after deploy');
}
