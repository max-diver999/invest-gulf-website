import { getCollection, type CollectionEntry } from 'astro:content';

export type PlaceEntry =
  | { path: string; collection: 'hubs'; entry: CollectionEntry<'hubs'> }
  | { path: string; collection: 'areas'; entry: CollectionEntry<'areas'> };

function normalise(path: string): string {
  return path.trim().replace(/^\/+|\/+$/g, '');
}

/**
 * Every page in the geography tree, from either collection, keyed by its own
 * `path` frontmatter. Districts stay in `areas` so the existing corpus tooling
 * keeps working; hubs, type pages and developer pages live in `hubs`.
 */
export async function getPlaceEntries(): Promise<PlaceEntry[]> {
  const hubs = await getCollection('hubs');
  const areas = await getCollection('areas');

  const places: PlaceEntry[] = hubs
    .filter((entry) => Boolean(entry.data.path))
    .map((entry) => ({ path: normalise(entry.data.path), collection: 'hubs' as const, entry }));

  for (const entry of areas) {
    const path = entry.data.path;
    if (!path) continue;
    places.push({ path: normalise(path), collection: 'areas' as const, entry });
  }

  return places;
}

/** Places under one top-level segment, with that segment stripped from the route param. */
export async function getPlacesUnder(root: string): Promise<
  Array<PlaceEntry & { rest: string | undefined }>
> {
  const prefix = normalise(root);
  const places = await getPlaceEntries();
  return places
    .filter((p) => p.path === prefix || p.path.startsWith(`${prefix}/`))
    .map((p) => {
      const rest = p.path.slice(prefix.length).replace(/^\/+/, '');
      return { ...p, rest: rest === '' ? undefined : rest };
    });
}

const SEGMENT_LABELS: Record<string, string> = {
  uae: 'UAE',
  dubai: 'Dubai',
  'abu-dhabi': 'Abu Dhabi',
  sharjah: 'Sharjah',
  ajman: 'Ajman',
  'ras-al-khaimah': 'Ras Al Khaimah',
  fujairah: 'Fujairah',
  'umm-al-quwain': 'Umm Al Quwain',
  'al-ain': 'Al Ain',
  'saudi-arabia': 'Saudi Arabia',
  qatar: 'Qatar',
  oman: 'Oman',
  bahrain: 'Bahrain',
  developers: 'Developers',
  living: 'Living',
  'apartments-for-sale': 'Apartments for sale',
  'villas-for-sale': 'Villas for sale',
  'off-plan': 'Off-plan',
  prices: 'Prices',
};

export function labelForSegment(segment: string): string {
  return (
    SEGMENT_LABELS[segment] ??
    segment
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  );
}

/** Breadcrumb trail for a place path, using the page title for the last crumb. */
export function breadcrumbsFor(path: string, title: string, siteUrl: string) {
  const segments = normalise(path).split('/');
  const trail = [{ name: 'Home', url: `${siteUrl}/` }];
  segments.forEach((segment, i) => {
    const url = `${siteUrl}/${segments.slice(0, i + 1).join('/')}/`;
    const last = i === segments.length - 1;
    trail.push({ name: last ? title : labelForSegment(segment), url });
  });
  return trail;
}
