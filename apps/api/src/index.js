export { createApp } from './app.js';
export { loadConfig, config } from './config.js';
export { createRecognitionProvider, normalizePlantIdResponse } from './recognition/index.js';

/**
 * Package identifier.
 * @returns {string}
 */
export function serviceName() {
  return 'api';
}
