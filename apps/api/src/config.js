/**
 * Runtime configuration, read once from the environment.
 *
 * Every value has a working default except PLANT_ID_API_KEY: leave that unset
 * and the recognition factory falls back to the fixture-backed stub, so the API
 * runs end-to-end with no credentials and no network. Only whoever is working
 * on the recognition module needs a real key.
 *
 * New variables must be added to .env.example AND infra/README.md in the same
 * commit (see CLAUDE.md).
 */

/**
 * Read an integer env var, falling back when unset or unparseable.
 * @param {string|undefined} value
 * @param {number} fallback
 * @returns {number}
 */
function intFromEnv(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * Build the config object from an environment bag.
 * @param {NodeJS.ProcessEnv} [env]
 */
export function loadConfig(env = process.env) {
  return {
    port: intFromEnv(env.PORT, 4000),
    plantIdApiKey: (env.PLANT_ID_API_KEY ?? '').trim(),
    plantIdBaseUrl: (env.PLANT_ID_BASE_URL ?? 'https://plant.id/api/v3').replace(/\/+$/, ''),
    /** Hard ceiling on one provider call. Mobile gives up at 90s; we fail first. */
    recognitionTimeoutMs: intFromEnv(env.FLORA_RECOGNITION_TIMEOUT_MS, 45_000),
    /** Decoded image ceiling. Temporary — bytes stop crossing the API once S3 lands. */
    maxImageBytes: intFromEnv(env.FLORA_MAX_IMAGE_BYTES, 6 * 1024 * 1024),
    /** Which canned Plant.id response the stub replays. */
    stubFixture: (env.FLORA_STUB_FIXTURE ?? 'healthy-basil').trim(),
    /**
     * Opt in to real Bedrock calls. An explicit flag rather than a key check:
     * Bedrock reads the ambient AWS credential chain, which is often populated
     * for reasons that have nothing to do with wanting to spend on inference.
     */
    llmEnabled: (env.FLORA_LLM_ENABLED ?? '').trim() === '1',
    bedrockRegion: (env.FLORA_BEDROCK_REGION ?? 'us-east-1').trim(),
    bedrockModelId: (env.FLORA_BEDROCK_MODEL_ID ?? 'openai.gpt-oss-120b-1:0').trim(),
    /** Ceiling on one model call. Shorter than recognition — these are small tasks. */
    llmTimeoutMs: intFromEnv(env.FLORA_LLM_TIMEOUT_MS, 30_000),
  };
}

export const config = loadConfig();
