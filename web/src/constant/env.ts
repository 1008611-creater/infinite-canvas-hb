export const APP_VERSION = __APP_VERSION__ || "dev";

export const DOCS_URL = import.meta.env.VITE_DOC_URL || "https://docs.canvas.best";

// Official plugin registry URL: CI publishes to plugins-dist for jsDelivr delivery; an environment variable may override it for self-hosting.
export const PLUGIN_REGISTRY_URL = import.meta.env.VITE_PLUGIN_REGISTRY_URL || "https://cdn.jsdelivr.net/gh/basketikun/infinite-canvas@plugins-dist/official-plugins.json";

/**
 * Agnes API key for the bundled video proxy (http://localhost:8787 locally, /agnes on the server).
 * Injected by scripts/windows/start.bat, which reads it from agnes-video-proxy/.env at launch.
 * Never hardcode a key here: .env* is gitignored, this file is not. Empty means the user must fill it in.
 */
export const AGNES_API_KEY = (import.meta.env.VITE_AGNES_API_KEY || "").trim();

/**
 * Base URL of the bundled Agnes video proxy.
 * Local dev falls back to http://localhost:8787; server builds pass VITE_AGNES_BASE_URL=/agnes so the
 * browser calls its own origin and nginx proxies to the 127.0.0.1:8787 daemon (no CORS, no open port).
 */
export const AGNES_BASE_URL = (import.meta.env.VITE_AGNES_BASE_URL || "").trim().replace(/\/+$/, "") || "http://localhost:8787";
