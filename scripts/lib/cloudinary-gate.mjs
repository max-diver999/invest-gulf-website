/** Validate that every Invest Gulf Cloudinary delivery URL is bandwidth-safe. */
import { DELIVERY_CLOUDS, isDeliveryCloud } from './cloudinary-clouds.mjs';

const ANY = /https?:\/\/res\.cloudinary\.com\/[^\s"'<>)\]]+/gi;
const DELIVERY = /^https:\/\/res\.cloudinary\.com\/([a-z0-9_-]+)\/image\/upload\/([^/]*)\/(.+)$/i;

export function runCloudinaryDeliveryChecks({ prefix, text, errors, legacyExempt = false }) {
  if (!text || !errors) return;
  for (const raw of new Set(text.match(ANY) || [])) {
    const url = raw.replace(/[.,;:]+$/, '');
    const match = url.match(DELIVERY);
    if (!match) {
      errors.push(`${prefix} malformed or bare Cloudinary delivery URL: ${url.slice(0, 100)}`);
      continue;
    }
    if (legacyExempt) continue;
    const [, cloud, transforms, publicId] = match;
    if (!isDeliveryCloud(cloud)) {
      errors.push(
        `${prefix} wrong Cloudinary account (${cloud}); expected one of ${DELIVERY_CLOUDS.join(', ')}`,
      );
    }
    if (!publicId.startsWith('more-group/gulf/')) {
      errors.push(`${prefix} wrong Cloudinary market path: ${publicId.slice(0, 90)}`);
    }
    const missing = [];
    if (!/\bf_auto\b/.test(transforms)) missing.push('f_auto');
    if (!/\bq_auto(?::[a-z]+)?\b/.test(transforms)) missing.push('q_auto');
    if (!/\bw_\d+\b/.test(transforms)) missing.push('w_<width>');
    if (missing.length) {
      errors.push(`${prefix} Cloudinary URL missing ${missing.join(', ')}: ${url.slice(0, 100)}`);
    }
    // Cloudinary rejects auto gravity outright unless a crop mode is present:
    // "Auto gravity can only be used with crop, fill, thumb, lfill, fill_pad,
    // auto, auto_pad". Such a URL is a 400 rather than a slow image, and the
    // shape checks above pass it happily, so it is worth naming here.
    if (/\bg_auto\b/.test(transforms) && !/\bc_(?:crop|fill|thumb|lfill|fill_pad|auto|auto_pad)\b/.test(transforms)) {
      errors.push(`${prefix} Cloudinary g_auto without a crop mode returns 400: ${url.slice(0, 100)}`);
    }
  }
}

export default { runCloudinaryDeliveryChecks };
