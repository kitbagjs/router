import { InjectionKey, inject } from 'vue'
import { RouterNotInstalledError } from '@/errors'
import { RouterRejection } from '@/services/createRouterReject'

export const routerRejectionKey: InjectionKey<RouterRejection> = Symbol()

/**
 * A composition to access the router's rejection state.
 *
 * @returns {RouterRejection} The rejection state object from the router, which can be used to handle route rejections
 *          such as authentication failures or permission denials.
 * @throws {Error} Throws an error if the router's rejection state is not available, typically indicating
 *         that createRouter was never called.
 * @group Compositions
 */
export function useRejection(): RouterRejection {
  const rejection = inject(routerRejectionKey)

  if (!rejection) {
    throw new RouterNotInstalledError()
  }

  return rejection
}
