/** Map-100 + batch2 map — full areas catalog for invest-gulf.com */

export const AREA_SLUGS_MAP100 = [
  'jvc-property-investment',
  'dubai-marina-property-investment',
  'business-bay-property-investment',
  'downtown-dubai-property-investment',
  'palm-jumeirah-property-investment',
  'dubai-hills-estate-property-investment',
  'dubai-south-property-investment',
  'jlt-property-investment',
  'dubai-creek-harbour-property-investment',
  'mbr-city-property-investment',
  'dubai-sports-city-property-investment',
  'arabian-ranches-property-investment',
  'dubai-islands-property-investment',
  'damac-hills-property-investment',
  'saadiyat-island-property-investment',
  'yas-island-property-investment',
  'al-reem-island-property-investment',
  'al-maryah-island-property-investment',
  'al-marjan-island-property-investment',
  'al-hamra-village-property-investment',
  'mina-al-arab-property-investment',
  'the-pearl-lusail-property-investment',
  'riyadh-property-investment',
];

/** GULF_RE_CONTENT_MAP_BATCH2_199 — all 54 ARE slugs */
export const AREA_SLUGS_BATCH2_ALL = [
  ...AREA_SLUGS_MAP100,
  'discovery-gardens-property-investment',
  'impz-property-investment',
  'town-square-property-investment',
  'jbr-property-investment',
  'bluewaters-island-property-investment',
  'dubai-harbour-property-investment',
  'city-walk-property-investment',
  'al-raha-beach-property-investment',
  'khalifa-city-property-investment',
  'al-nakheel-rak-property-investment',
  'masdar-city-property-investment',
  'al-reef-abu-dhabi-property-investment',
  'dubai-silicon-oasis-property-investment',
  'motor-city-property-investment',
  'dubai-production-city-property-investment',
  'al-furjan-property-investment',
  'mudon-property-investment',
  'villanova-property-investment',
  'the-valley-dubai-property-investment',
  'aljada-sharjah-property-investment',
  'al-zahia-sharjah-property-investment',
  'al-ghadeer-property-investment',
  'amwaj-islands-property-investment',
  'dammam-khobar-property-investment',
  'hudayriyat-island-property-investment',
  'jeddah-property-investment',
  'lusail-city-property-investment',
  'manama-property-investment',
  'muscat-al-mouj-property-investment',
  'muscat-qurum-property-investment',
  'west-bay-doha-property-investment',
];

/** Batch3 — 4 district guides missed in batch2 map */
export const AREA_SLUGS_BATCH3 = [
  'al-barari-property-investment',
  'meydan-horizon-property-investment',
  'tilal-al-ghaf-property-investment',
  'jebel-ali-village-property-investment',
];

/** Full areas catalog (map-100 + batch2 + batch3) */
export const AREA_SLUGS_ALL = [...AREA_SLUGS_BATCH2_ALL, ...AREA_SLUGS_BATCH3];

/** Batch2 remainder after map-100 migration (31 slugs) */
export const AREA_SLUGS_BATCH2 = AREA_SLUGS_BATCH2_ALL.filter(
  (s) => !AREA_SLUGS_MAP100.includes(s),
);

/** @deprecated use AREA_SLUGS_MAP100 */
export const AREA_SLUGS = AREA_SLUGS_MAP100;
