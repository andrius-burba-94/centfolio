// Stub for the `server-only` package so Vitest can transform modules
// that import it. Vitest runs in a node environment that's neither
// Next's server nor client; the marker has no runtime effect there.
// In Next, the real package throws if imported into a Client
// Component module, which is enforced at build time, not at test time.
export {};
