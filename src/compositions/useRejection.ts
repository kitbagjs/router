import { InjectionKey, inject } from 'vue'
import { RouterNotInstalledError } from '@/errors/routerNotInstalledError'
import { RouterRejection } from '@/services/createRouterReject'
import { createRouterKeyStore } from '@/services/createRouterKeyStore'
import { Router } from '@/types/router'

export const getRouterRejectionInjectionKey = createRouterKeyStore<RouterRejection>()

type UseRejectionFunction = () => RouterRejection

export function createUseRejection(routerKey: InjectionKey<Router>): UseRejectionFunction {
  const routerRejectionKey = getRouterRejectionInjectionKey(routerKey)

  return (): RouterRejection => {
    const rejection = inject(routerRejectionKey)

    if (!rejection) {
      throw new RouterNotInstalledError()
    }

    return rejection
  }
}
