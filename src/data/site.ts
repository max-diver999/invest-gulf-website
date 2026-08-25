export const SITE = {
  name: 'Invest Gulf',
  tagline: 'Independent guides to UAE & Gulf property investment',
  url: 'https://invest-gulf.com',
  description:
    'Independent research on Dubai, Abu Dhabi, and Gulf property investment, fees, yields, Golden Visa, and off-plan risks. Not a developer. Not a portal.',
  email: 'info@invest-gulf.com',
  whatsapp: 'https://wa.me/66651195327',
  editorial: 'Invest Gulf Editorial',
  /** Set after Wikidata item creation — _СИСТЕМА/GEO_WIKIDATA_INVEST_GULF.md */
  wikidataId: 'Q140471703' as string | null,
  /**
   * External profiles that prove the entity exists outside this domain. Self-references carry
   * no weight — Wikidata is appended automatically from `wikidataId` in BaseLayout.
   *
   * The domain has no external authority (DR ~0), which is the single biggest brake on recovery
   * from the June demotion. Real profiles here (LinkedIn company page, Crunchbase, an industry
   * directory listing, the founder's LinkedIn) are worth more than any on-page change.
   */
  sameAs: [] as string[],
};
