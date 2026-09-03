/// <reference types="vite/client" />

/**
 * Typed environment. Without this, `import.meta.env.VITE_*` is `any` and the
 * strict lint rules cannot see through it.
 */
interface ImportMetaEnv {
  /** Backend origin. Unset in development means requests go to MSW. */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
