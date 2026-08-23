/**
 * Gulf currency pegs.
 *
 * These are central-bank policy pegs, not market quotes, so they hold without
 * a live rate feed and a conversion built on them is exact rather than
 * indicative. That is the whole reason the currency toggle offers USD and
 * nothing else: EUR, GBP and INR float, this site has no rate source, and an
 * invented rate on a page that tells readers to verify every figure would be
 * worse than offering no conversion at all.
 *
 * KWD is deliberately absent. The dinar tracks an undisclosed currency basket
 * rather than a fixed dollar peg, so no fixed divisor is defensible. Its 40
 * occurrences in the corpus stay unconverted.
 */
export type PeggedCurrency = 'AED' | 'SAR' | 'QAR' | 'OMR' | 'BHD';

/** Units of local currency per 1 USD. */
export const USD_PEGS: Record<PeggedCurrency, number> = {
  AED: 3.6725,
  SAR: 3.75,
  QAR: 3.64,
  OMR: 0.3845,
  BHD: 0.376,
};

export const PEG_AUTHORITY: Record<PeggedCurrency, string> = {
  AED: 'UAE Central Bank',
  SAR: 'Saudi Central Bank',
  QAR: 'Qatar Central Bank',
  OMR: 'Central Bank of Oman',
  BHD: 'Central Bank of Bahrain',
};
