import cloudDimensions from '../data/gulf-image-dimensions.json';
import r2Widths from '../data/r2-image-widths.json';
import localDimensions from '../../scripts/data/image-dimensions.json';

type Variant = 'hero' | 'body' | 'card';
type Dimension = { width: number; height: number };
type LocalCandidate = { url: string; width: number };
type LocalHeroFallback = { src: string; candidates: LocalCandidate[] };

const R2_PATTERN = /^https:\/\/pub-[a-f0-9]+\.r2\.dev\/(.+)$/i;
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

function r2PublicId(src: string): string | null {
  const match = R2_PATTERN.exec(src.trim());
  if (!match) return null;
  return match[1].replace(/\.webp$/i, '');
}

export function gulfPublicId(src: string): string | null {
  const fromR2 = r2PublicId(src);
  if (fromR2?.startsWith(PREFIX)) return fromR2;
  return null;
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

/**
 * Список ширин, которые реально лежат на R2 рядом с картинкой.
 *
 * До 22.09.2026 здесь стояло srcset из одного кандидата: `${src} ${native.width}w`. Атрибут был,
 * а выбора у браузера не было, и телефон качал файл для компьютера. Замер на живом сайте:
 * список проектов отдавал 2422 КБ и телефону, и компьютеру.
 *
 * Какие ширины залиты, знает манифест (scripts/r2-add-widths.mjs в корне рабочего каталога).
 * Гадать нельзя: браузер попросит несуществующий файл и получит 404 вместо картинки.
 */
function r2Srcset(src: string, key: string, nativeWidth: number): string {
  const entry = (r2Widths as Record<string, { w: number; h: number; variants: number[] }>)[key];
  const variants = (entry?.variants ?? []).filter((w) => w < (entry?.w ?? nativeWidth)).sort((a, b) => a - b);
  if (!variants.length) return `${src} ${nativeWidth}w`;
  const narrow = variants.map((w) => `${src.replace(/\.webp$/i, `-w${w}.webp`)} ${w}w`);
  return [...narrow, `${src} ${entry?.w ?? nativeWidth}w`].join(', ');
}

export function responsiveImage(src: string, variant: Variant = 'hero') {
  const r2Id = r2PublicId(src);
  if (r2Id?.startsWith(PREFIX)) {
    const manifest = (r2Widths as Record<string, { w: number; h: number }>)[`${r2Id}.webp`];
    const native = (cloudDimensions as Record<string, Dimension>)[r2Id]
      ?? (manifest ? { width: manifest.w, height: manifest.h } : undefined);
    if (!native) throw new Error(`Missing Gulf image dimensions for ${r2Id}`);
    return {
      src,
      srcset: r2Srcset(src, `${r2Id}.webp`, native.width),
      sizes: variant === 'card'
        ? '(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 320px'
        : variant === 'hero'
          ? ARTICLE_SIZES
          : '(max-width: 599px) calc(100vw - 3rem), 72ch',
      width: native.width,
      height: native.height,
    };
  }

  const publicId = gulfPublicId(src);
  const localHero = publicId && variant === 'hero' ? LOCAL_HERO_FALLBACKS[publicId] : undefined;
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

  const local = (localDimensions as Record<string, Dimension>)[src];
  return {
    src,
    srcset: undefined,
    sizes: undefined,
    width: local?.width ?? (variant === 'card' ? 640 : 1280),
    height: local?.height ?? (variant === 'card' ? 360 : 720),
  };
}
