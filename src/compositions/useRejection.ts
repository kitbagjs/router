import { InjectionKey, inject } from 'vue'
import { RouterRejection } from '@/services/createRouterReject'

export const routerRejectionKey: InjectionKey<RouterRejection> = Symbol()

/**
 * Composition API function to access the router's rejection state.
 *
 * @returns {RouterRejection} The rejection state object from the router, which can be used to handle route rejections
 *          such as authentication failures or permission denials.
 * @throws {Error} Throws an error if the router's rejection state is not available, typically indicating
 *         that createRouter was never called.
 */
export function useRejection(): RouterRejection {
  const rejection = inject(routerRejectionKey)

  if (!rejection) {
    throw new Error('Router is not installed')
  }

  return rejection
}