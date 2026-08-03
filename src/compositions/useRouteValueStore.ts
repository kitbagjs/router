import { inject, InjectionKey } from 'vue'
import { RouterNotInstalledError } from '@/errors/routerNotInstalledError'
import { RouteValueStore } from '@/services/createRouteValueStore'
import { createRouterKeyStore } from '@/services/createRouterKeyStore'
import { Router } from '@/types/router'

export const getRouteValueStoreInjectionKey = createRouterKeyStore<RouteValueStore>()

type UseRouteValueStore = () => RouteValueStore

export function createUseRouteValueStore<TRouter extends Router>(routerKey: InjectionKey<TRouter>): UseRouteValueStore {
  const valueStoreKey = getRouteValueStoreInjectionKey(routerKey)

  return (): RouteValueStore => {
    const store = inject(valueStoreKey)

    if (!store) {
      throw new RouterNotInstalledError()
    }

    return store
  }
}
