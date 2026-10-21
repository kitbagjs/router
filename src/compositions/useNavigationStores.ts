import { inject, InjectionKey } from 'vue'
import { RouterNotInstalledError } from '@/errors/routerNotInstalledError'
import { NavigationStores } from '@/services/createNavigationStores'
import { createRouterKeyStore } from '@/services/createRouterKeyStore'
import { Router } from '@/types/router'

export const getNavigationStoresInjectionKey = createRouterKeyStore<NavigationStores>()

type UseNavigationStores = () => NavigationStores

export function createUseNavigationStores<TRouter extends Router>(routerKey: InjectionKey<TRouter>): UseNavigationStores {
  const navigationStoresKey = getNavigationStoresInjectionKey(routerKey)

  return (): NavigationStores => {
    const store = inject(navigationStoresKey)

    if (!store) {
      throw new RouterNotInstalledError()
    }

    return store
  }
}
