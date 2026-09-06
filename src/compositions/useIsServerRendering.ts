import { inject, InjectionKey, ssrContextKey } from 'vue'

// vue exports this as a bare symbol, so it needs typing for inject to report whether it is there
const SSR_CONTEXT_KEY = ssrContextKey as InjectionKey<Record<string, unknown>>

/**
 * True under `renderToString`, false on the client including while hydrating through `createSSRApp`.
 * Must be called during setup.
 */
export function useIsServerRendering(): boolean {
  return inject(SSR_CONTEXT_KEY, null) !== null
}
