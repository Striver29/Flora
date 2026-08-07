/**
 * Shared JSDoc typedefs for Flora. This module has no runtime exports —
 * import the types with `import('./types.js').TypeName` in JSDoc annotations.
 *
 * @template T
 * @typedef {{ ok: true, data: T } | { ok: false, error: { code: string, message: string } }} ApiResponse
 */

/**
 * Care requirements for a species.
 * @typedef {Object} SpeciesCare
 * @property {number} waterEveryDays
 * @property {string} sun e.g. "full sun", "partial shade"
 * @property {{ min: number, max: number }} tempC comfortable temperature range in °C
 */

/**
 * A plant species as returned by the API.
 * @typedef {Object} SpeciesDto
 * @property {string} scientificName
 * @property {string[]} commonNames
 * @property {SpeciesCare} care
 */

/**
 * One candidate species from the recognition provider.
 * @typedef {Object} SpeciesCandidate
 * @property {string} scientificName
 * @property {string[]} commonNames
 * @property {number} probability 0..1
 * @property {string} [speciesId] catalog id when the candidate maps to a known species
 */

/**
 * A detected health issue with suggested treatments.
 * @typedef {Object} HealthIssue
 * @property {string} name
 * @property {number} probability 0..1
 * @property {string[]} treatmentHints
 */

/**
 * Health assessment of a photographed plant.
 * @typedef {Object} HealthAssessment
 * @property {boolean} isHealthy
 * @property {HealthIssue[]} issues
 * @property {number} confidence 0..1
 */

/**
 * Result of running a photo through plant recognition.
 * @typedef {Object} RecognitionResult
 * @property {SpeciesCandidate[]} species best matches, most likely first
 * @property {HealthAssessment} health
 */

/**
 * Summary card of how to care for a plant, shown on the mobile home screen.
 * @typedef {Object} CareCard
 * @property {string} plantId
 * @property {string} nickname
 * @property {SpeciesCare} care
 * @property {string[]} tips
 */

export {};
