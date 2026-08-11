/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// React 19 exposes `inert` as boolean on HTMLAttributes.
// Older @types/react versions may not include it — extend here for safety.
declare namespace React {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLAttributes<T> {
    inert?: boolean;
  }
}
