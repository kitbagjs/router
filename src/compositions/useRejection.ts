import { InjectionKey, inject } from 'vue'
import { RouterNotInstalledError } from '@/errors/routerNotInstalledError'
import { RouterRejection, RouterRejections } from '@/services/createRouterReject'
import { createRouterKeyStore } from '@/services/createRouterKeyStore'
import { Router } from '@/types/router'

export const getRouterRejectionInjectionKey = createRouterKeyStore<RouterRejection>()

export function createUseRejection<TRouter extends Router>(routerKey: InjectionKey<TRouter>): () => RouterRejection<RouterRejections<TRouter>>
export function createUseRejection(routerKey: InjectionKey<Router>): () => RouterRejection {
  const routerRejectionKey = getRouterRejectionInjectionKey(routerKey)

  return (): RouterRejection => {
    const rejection = inject(routerRejectionKey)

    if (!rejection) {
      throw new RouterNotInstalledError()
    }

    return rejection
  }
}
