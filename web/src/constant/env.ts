export const APP_VERSION = __APP_VERSION__ || "dev";

export const DOCS_URL = import.meta.env.VITE_DOC_URL || "https://docs.canvas.best";

// Official plugin registry URL: CI publishes to plugins-dist for jsDelivr delivery; an environment variable may override it for self-hosting.
export const PLUGIN_REGISTRY_URL = import.meta.env.VITE_PLUGIN_REGISTRY_URL || "https://cdn.jsdelivr.net/gh/basketikun/infinite-canvas@plugins-dist/official-plugins.json";

/**
 * Agnes API key for the bundled local video proxy (http://localhost:8787).
 * Injected by scripts/windows/start.bat, which reads it from agnes-video-proxy/.env at launch.
 * Never hardcode a key here: .env* is gitignored, this file is not. Empty means the user must fill it in the config panel.
 */
export const AGNES_API_KEY = (import.meta.env.VITE_AGNES_API_KEY || "").trim();
