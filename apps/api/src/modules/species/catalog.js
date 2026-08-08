/**
 * Minimal species catalog: the scientific names the recognition provider might
 * return, mapped to our catalog ids.
 *
 * This is a stand-in for a `species` table and deliberately holds only what
 * resolution needs — care data, common names and zone multipliers stay in the
 * mobile seed until the DB lands, at which point both collapse into one source.
 * Keep the ids in step with apps/mobile/src/api/seed/species.js.
 */
const SPECIES_BY_SCIENTIFIC_NAME = new Map([
  ['ocimum basilicum', 'sp1'],
  ['solanum lycopersicum', 'sp2'],
  ['mentha spicata', 'sp3'],
  ['olea europaea', 'sp4'],
  ['ficus carica', 'sp5'],
]);

/**
 * Resolve a provider-supplied scientific name to a catalog id.
 *
 * Providers append authority citations and cultivar suffixes ("Ocimum
 * basilicum L.", "Ocimum basilicum 'Genovese'"), so match on the leading
 * genus + species binomial rather than the full string. No match returns null,
 * which the result screen renders as a suggestion you cannot tap through.
 *
 * @param {string} scientificName
 * @returns {string|null}
 */
export function resolveSpeciesId(scientificName) {
  const normalized = String(scientificName ?? '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join(' ');

  return SPECIES_BY_SCIENTIFIC_NAME.get(normalized) ?? null;
}
