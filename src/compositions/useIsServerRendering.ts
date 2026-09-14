import { inject, InjectionKey, ssrContextKey } from 'vue'

const SSR_CONTEXT_KEY = ssrContextKey as InjectionKey<Record<string, unknown>>

/**
 * True under `renderToString`, false on the client including while hydrating through `createSSRApp`.
 * Must be called during setup.
 */
export function useIsServerRendering(): boolean {
  return inject(SSR_CONTEXT_KEY, null) !== null
}
