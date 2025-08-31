import { inject, InjectionKey } from 'vue'
import { RouterNotInstalledError } from '@/errors/routerNotInstalledError'
import { PropStore } from '@/services/createPropStore'
import { createRouterKeyStore } from '@/services/createRouterKeyStore'
import { Router } from '@/types/router'

export const getPropStoreInjectionKey = createRouterKeyStore<PropStore>()

type UsePropStore = () => PropStore

export function createUsePropStore<TRouter extends Router>(key: InjectionKey<TRouter>): UsePropStore {
  const propStoreKey = getPropStoreInjectionKey(key)

  return (): PropStore => {
    const store = inject(propStoreKey)

    if (!store) {
      throw new RouterNotInstalledError()
    }

    return store
  }
}
