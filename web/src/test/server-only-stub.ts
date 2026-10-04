/**
 * Vitest alias target for the `server-only` package, which throws outside a
 * React Server Components bundler. Tests run in plain Node, so the marker is
 * a no-op here. The import still protects production bundles.
 */
export {}
