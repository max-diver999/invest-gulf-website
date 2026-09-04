import cloudDimensions from '../data/gulf-image-dimensions.json';
import localDimensions from '../../scripts/data/image-dimensions.json';

type Variant = 'hero' | 'body' | 'card';
type Dimension = { width: number; height: number };
type LocalCandidate = { url: string; width: number };
type LocalHeroFallback = { src: string; candidates: LocalCandidate[] };

const CLOUD = 'dlrrtf6bq';
const PREFIX = 'more-group/gulf/';
const WIDTHS = {
  hero: [360, 640, 960, 1200],
  body: [360, 640, 960, 1200],
  card: [320, 360, 480, 640],
} as const;
const ARTICLE_SIZES =
  '(max-width: 599px) calc(100vw - 3rem), (max-width: 1087px) 92vw, '
  + '(max-width: 1399px) calc(68rem - 8vw), 976px';
const LOCAL_HERO_FALLBACKS: Record<string, LocalHeroFallback> = {
  'more-group/gulf/areas/downtown-dubai/hero-0747510681': {
    src: '/images/areas/downtown-dubai/hero.jpg',
    candidates: [
      { url: '/images/areas/downtown-dubai/hero-360.webp', width: 360 },
      { url: '/images/areas/downtown-dubai/hero-640.webp', width: 640 },
      { url: '/images/areas/downtown-dubai/hero-960.webp', width: 960 },
      { url: '/images/areas/downtown-dubai/hero-1200.webp', width: 1200 },
      { url: '/images/areas/downtown-dubai/hero.jpg', width: 1280 },
    ],
  },
  'more-group/gulf/projects/address-residences-dubai-hills/hero-f8810edaf1': {
    src: '/images/projects/address-residences-dubai-hills/hero.webp',
    candidates: [
      { url: '/images/projects/address-residences-dubai-hills/hero-360.webp', width: 360 },
      { url: '/images/projects/address-residences-dubai-hills/hero-640.webp', width: 640 },
      { url: '/images/projects/address-residences-dubai-hills/hero-960.webp', width: 960 },
      { url: '/images/projects/address-residences-dubai-hills/hero.webp', width: 1024 },
    ],
  },
};

export function gulfPublicId(src: string): string | null {
  const delivery = `res.cloudinary.com/${CLOUD}/image/upload/`;
  const marker = `/${PREFIX}`;
  const markerIndex = src.indexOf(marker);
  if (!src.includes(delivery) || markerIndex === -1) return null;
  return src.slice(markerIndex + 1).replace(/\.(avif|gif|jpe?g|png|webp)$/i, '');
}

export function gulfDeliveryUrl(publicId: string, width: number): string {
  if (!publicId.startsWith(PREFIX)) throw new Error(`Unexpected Gulf public ID: ${publicId}`);
  return `https://res.cloudinary.com/${CLOUD}/image/upload/f_auto,q_auto:eco,g_auto,w_${width}/${publicId}`;
}

/** Smallest variant for LCP preload (mobile-first). */
export function lcpPreloadFromResponsive(src: string, variant: Variant = 'hero') {
  const img = responsiveImage(src, variant);
  let href = img.src;
  if (img.srcset) {
    const firstEntry = img.srcset.split(/,\s+/)[0]?.trim() ?? '';
    href = firstEntry.replace(/\s+\d+w$/, '') || href;
  }
  return {
    src: href,
    srcset: img.srcset,
    sizes: img.sizes,
  };
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

  const localHero = variant === 'hero' ? LOCAL_HERO_FALLBACKS[publicId] : undefined;
  if (localHero) {
    const local = (localDimensions as Record<string, Dimension>)[localHero.src];
    return {
      src: localHero.src,
      srcset: localHero.candidates.map(({ url, width }) => `${url} ${width}w`).join(', '),
      sizes: ARTICLE_SIZES,
      width: local?.width ?? 1280,
      height: local?.height ?? 720,
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
      : variant === 'hero'
        ? ARTICLE_SIZES
        : '(max-width: 599px) calc(100vw - 3rem), 72ch',
    width: native.width,
    height: native.height,
  };
}
