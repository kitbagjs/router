import { InjectionKey, inject } from 'vue'
import { RouterNotInstalledError } from '@/errors'
import { RouterRejection } from '@/services/createRouterReject'
import { createRouterKeyStore } from '@/services/createRouterKeyStore'
import { Router } from '@/types/router'

export const getRouterRejectionInjectionKey = createRouterKeyStore<RouterRejection>()

type UseRejectionFunction = () => RouterRejection

export function createUseRejection(key: InjectionKey<Router>): UseRejectionFunction {
  const routerRejectionKey = getRouterRejectionInjectionKey(key)

  return (): RouterRejection => {
    const rejection = inject(routerRejectionKey)

    if (!rejection) {
      throw new RouterNotInstalledError()
    }

    return rejection
  }
}
