import { inject, InjectionKey } from 'vue'
import { RouterNotInstalledError } from '@/errors/routerNotInstalledError'
import { SsrContextStore } from '@/services/createSsrContextStore'
import { createRouterKeyStore } from '@/services/createRouterKeyStore'
import { Router } from '@/types/router'

export const getSsrContextStoreInjectionKey = createRouterKeyStore<SsrContextStore>()

export function createUseRouterSsrContext<TRouter extends Router>(routerKey: InjectionKey<TRouter>) {
  const ssrContextStoreKey = getSsrContextStoreInjectionKey(routerKey)

  return (): SsrContextStore => {
    const store = inject(ssrContextStoreKey)

    if (!store) {
      throw new RouterNotInstalledError()
    }

    return store
  }
}
