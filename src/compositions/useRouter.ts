import { InjectionKey, inject } from 'vue'
import { RouterNotInstalledError } from '@/errors'
import { RegisteredRouter, Router } from '@/types'

export const routerInjectionKey: InjectionKey<RegisteredRouter> = Symbol()

/**
 * A composition to access the registered router instance within a Vue component.
 *
 * @returns The registered router instance.
 * @throws {RouterNotInstalledError} Throws an error if the router has not been installed,
 *         ensuring the component does not operate without routing functionality.
 * @group Compositions
 */
export const useRouter = createUseRouter(routerInjectionKey)

export function createUseRouter<T extends Router>(key: InjectionKey<T>): () => T {
  return () => {
    const router = inject(key)

    if (!router) {
      throw new RouterNotInstalledError()
    }

    return router
  }
}
