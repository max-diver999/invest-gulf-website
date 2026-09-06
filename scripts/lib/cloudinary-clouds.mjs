/**
 * Cloudinary account routing for Invest Gulf.
 *
 * Policy: `99_Системное/CLOUDINARY_ROUTING.md`. The holding runs three clouds
 * and this site touches two of them:
 *
 * - `dlrrtf6bq` is legacy and read-only. Its URLs stay in the corpus exactly as
 *   they are, because re-uploading them elsewhere would spend bandwidth on an
 *   account that is already at the edge of its plan. Nothing new goes here.
 * - `bwppi9gc` takes every new upload.
 *
 * Both therefore appear in the corpus at once, which the policy expects. Code
 * that builds a derivative URL must keep the cloud of the source rather than
 * assuming one, or an image on the active cloud gets a srcset pointing at the
 * legacy one.
 */
export const LEGACY_CLOUD = 'dlrrtf6bq';
export const ACTIVE_CLOUD = 'bwppi9gc';

/** Every cloud a delivery URL in this corpus may legitimately name. */
export const DELIVERY_CLOUDS = Object.freeze([LEGACY_CLOUD, ACTIVE_CLOUD]);

const CLOUD_IN_URL = /res\.cloudinary\.com\/([a-z0-9_-]+)\/image\/upload\//i;

export function isDeliveryCloud(cloud) {
  return DELIVERY_CLOUDS.includes(cloud);
}

/** The cloud a delivery URL names, or null when it is not one of ours. */
export function cloudFromUrl(url) {
  const match = String(url).match(CLOUD_IN_URL);
  return match && isDeliveryCloud(match[1]) ? match[1] : null;
}

export default { LEGACY_CLOUD, ACTIVE_CLOUD, DELIVERY_CLOUDS, isDeliveryCloud, cloudFromUrl };
