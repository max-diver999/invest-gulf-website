/**
 * Intent routing for Invest Gulf bridge CTAs (InlineCta + CommercialBridge).
 */

/** @typedef {{ bridgeVariant: string, buttonHref: string, ctaIdPrefix: string }} CtaRoute */

/**
 * @param {{ collection: string, slug: string, title?: string }} ctx
 * @returns {CtaRoute}
 */
export function resolveCtaRoute({ collection, slug, title = '' }) {
  const s = `${slug} ${title}`.toLowerCase();

  if (/golden-visa|visa-property|uae-visa|investor-750k|residency-options|golden-residence/.test(s)) {
    return route('visa', '/golden-visa-dubai-property/', 'visa');
  }

  if (/off-plan|payment-plan|handover|snagging|cooling-off|assignment-sale|flip-off-plan|offplan/.test(s)) {
    if (/abu-dhabi|adgm|yas|saadiyat|al-reem|maryah/.test(s)) {
      return route('abu-dhabi-offplan', '/invest-abu-dhabi-off-plan/', 'offplan_ad');
    }
    return route('offplan', '/invest-dubai-off-plan/', 'offplan');
  }

  if (collection === 'compare' || /\bvs-|-vs-|comparison|compare-/.test(slug)) {
    return route('compare', '/gulf-property-investment-consultation/', 'compare');
  }

  if (/qatar-property|qatar-rental|qatar-off-plan|doha-/.test(s)) {
    return route('area-qatar', '/gulf-property-investment-consultation/', 'qatar');
  }
  if (/saudi-property|saudi-rental|saudi-off-plan|saudi-arabia|riyadh|jeddah|dammam|neom/.test(s)) {
    return route('area-saudi', '/gulf-property-investment-consultation/', 'saudi');
  }
  if (/bahrain-property|bahrain-rental|bahrain-vs|living-seef|manama|amwaj/.test(s)) {
    return route('area-bahrain', '/gulf-property-investment-consultation/', 'bahrain');
  }
  if (/oman-property|oman-rental|muscat|salalah|sohar/.test(s)) {
    return route('area-oman', '/gulf-property-investment-consultation/', 'oman');
  }
  if (/kuwait-property|kuwait-rental/.test(s)) {
    return route('compare', '/gulf-property-investment-consultation/', 'kuwait');
  }

  if (/rak|ras-al-khaimah|al-marjan|wynn|mina-al-arab|hamra-village|al-nakheel-rak/.test(s)) {
    return route('rak', '/invest-ras-al-khaimah-property/', 'rak');
  }

  if (/abu-dhabi|adgm|yas-island|saadiyat|al-reem|al-maryah|khalifa-city|masdar|al-raha|al-reef|hudayriyat|al-ghadeer/.test(s)) {
    return route('abu-dhabi', '/abu-dhabi-property-investment/', 'abudhabi');
  }

  if (/rental-yield|yield-guide|rent-prices|roi|holiday-home-roi|buy-to-let|capital-appreciation-vs-yield/.test(s)) {
    if (/abu-dhabi/.test(s)) return route('abu-dhabi', '/abu-dhabi-property-investment/', 'yield_ad');
    return route('yield', '/invest-dubai-property/', 'yield');
  }

  if (/mortgage|loan|finance|bank-transfer|cash-vs-mortgage|dld-mortgage|islamic-vs-conventional/.test(s)) {
    return route('money', '/invest-dubai-property/', 'finance');
  }

  if (/company-setup|free-zone|mainland-llc|difc|dmcc|shams|rakez|adgm-setup/.test(s)) {
    return route('compare', '/gulf-property-investment-consultation/', 'biz');
  }

  if (collection === 'areas') {
    if (/abu-dhabi|reem|saadiyat|yas|maryah|raha|reef|ghadeer|khalifa|masdar|hudayriyat/.test(s)) {
      return route('abu-dhabi', '/abu-dhabi-property-investment/', 'area_ad');
    }
    if (/rak|marjan|hamra|nakheel-rak|mina-al-arab/.test(s)) {
      return route('rak', '/invest-ras-al-khaimah-property/', 'area_rak');
    }
    return route('money', '/invest-dubai-property/', 'area_dubai');
  }

  if (collection === 'projects') {
    return route('offplan', '/invest-dubai-off-plan/', 'project');
  }

  if (
    /dubai-property|dubai-invest|foreigners-buy|due-diligence-dubai|cost-of-buying|best-areas-buy|dubai-developers|dubai-business|gulf-property-investment|can-foreigners|how-to-buy.*dubai|buy-property-dubai/.test(
      s,
    )
  ) {
    return route('money', '/invest-dubai-property/', 'dubai');
  }

  if (/sharjah|ajman|fujairah|umm-al-quwain/.test(s)) {
    return route('money', '/invest-dubai-property/', 'emirates_north');
  }

  return route('money', '/get-shortlist/', 'generic');
}

/** @returns {CtaRoute} */
function route(bridgeVariant, buttonHref, ctaIdPrefix) {
  return { bridgeVariant, buttonHref, ctaIdPrefix };
}

/**
 * @param {string} slug
 * @param {string} prefix
 */
export function makeCtaId(prefix, slug) {
  const tail = slug.replace(/[^a-z0-9]+/g, '-').slice(0, 24);
  return `${prefix}_cta_${tail}`;
}

const STICKY_COPY = {
  visa: {
    title: 'Golden Visa via property',
    subtitle: 'AED 2M+ qualifying shortlist',
    buttonText: 'Visa shortlist',
  },
  offplan: {
    title: 'Dubai off-plan shortlist',
    subtitle: 'Escrow-checked launches',
    buttonText: 'See off-plan',
  },
  'abu-dhabi-offplan': {
    title: 'Abu Dhabi off-plan',
    subtitle: 'Yas · Saadiyat · Al Reem',
    buttonText: 'Get shortlist',
  },
  'abu-dhabi': {
    title: 'Abu Dhabi property',
    subtitle: 'Freehold areas matched',
    buttonText: 'Abu Dhabi options',
  },
  rak: {
    title: 'RAK property shortlist',
    subtitle: 'Al Marjan · coastal yield',
    buttonText: 'RAK options',
  },
  yield: {
    title: 'Dubai yield shortlist',
    subtitle: 'Net yield, not brochure gross',
    buttonText: 'Yield options',
  },
  compare: {
    title: 'Compare Gulf markets',
    subtitle: 'One brief, multi-market',
    buttonText: 'Book consult',
  },
  'area-qatar': {
    title: 'Qatar property enquiry',
    subtitle: 'Pearl · Lusail zones',
    buttonText: 'Qatar options',
  },
  'area-saudi': {
    title: 'Saudi property enquiry',
    subtitle: 'Eligible projects only',
    buttonText: 'Saudi options',
  },
  'area-bahrain': {
    title: 'Bahrain property',
    subtitle: 'Amwaj · Seef · Manama',
    buttonText: 'Bahrain options',
  },
  'area-oman': {
    title: 'Oman property enquiry',
    subtitle: 'Muscat freehold zones',
    buttonText: 'Oman options',
  },
  money: {
    title: 'Gulf property shortlist',
    subtitle: 'Free · one business day',
    buttonText: 'Get shortlist',
  },
};

/**
 * @param {{ collection: string, slug: string, title?: string }} ctx
 */
export function resolveStickyCta(ctx) {
  const { bridgeVariant, buttonHref, ctaIdPrefix } = resolveCtaRoute(ctx);
  const copy = STICKY_COPY[bridgeVariant] || STICKY_COPY.money;
  return {
    title: copy.title,
    subtitle: copy.subtitle,
    buttonText: copy.buttonText,
    buttonHref,
    ctaId: makeCtaId(`sticky_${ctaIdPrefix}`, ctx.slug || 'page'),
  };
}
