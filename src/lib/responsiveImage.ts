import cloudDimensions from '../data/gulf-image-dimensions.json';
import localDimensions from '../../scripts/data/image-dimensions.json';

type Variant = 'hero' | 'body' | 'card';
type Dimension = { width: number; height: number };

const CLOUD = 'dlrrtf6bq';
const PREFIX = 'more-group/gulf/';
const WIDTHS = {
  hero: [640, 960, 1200],
  body: [640, 960, 1200],
  card: [320, 480, 640],
} as const;

export function gulfPublicId(src: string): string | null {
  const delivery = `res.cloudinary.com/${CLOUD}/image/upload/`;
  const marker = `/${PREFIX}`;
  const markerIndex = src.indexOf(marker);
  if (!src.includes(delivery) || markerIndex === -1) return null;
  return src.slice(markerIndex + 1).replace(/\.(avif|gif|jpe?g|png|webp)$/i, '');
}

export function gulfDeliveryUrl(publicId: string, width: number): string {
  if (!publicId.startsWith(PREFIX)) throw new Error(`Unexpected Gulf public ID: ${publicId}`);
  return `https://res.cloudinary.com/${CLOUD}/image/upload/f_auto,q_auto:low,w_${width}/${publicId}`;
}

export function responsiveImage(src: string, variant: Variant = 'hero') {
  const publicId = gulfPublicId(src);
  if (!publicId) {
    const local = (localDimensions as Record<string, Dimension>)[src];
    return {
      src,
      srcset: undefined,
      sizes: undefined,
      width: local?.width ?? (variant === 'card' ? 640 : 1280),
      height: local?.height ?? (variant === 'card' ? 360 : 720),
    };
  }

  const native = (cloudDimensions as Record<string, Dimension>)[publicId];
  if (!native) throw new Error(`Missing Gulf image dimensions for ${publicId}`);
  const requested = WIDTHS[variant].filter((width) => width <= native.width);
  const widths = requested.length ? requested : [native.width];
  const largest = widths.at(-1) ?? native.width;
  return {
    src: gulfDeliveryUrl(publicId, largest),
    srcset: widths.map((width) => `${gulfDeliveryUrl(publicId, width)} ${width}w`).join(', '),
    sizes: variant === 'card'
      ? '(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 320px'
      : '(max-width: 767px) calc(100vw - 2rem), 768px',
    width: native.width,
    height: native.height,
  };
}
