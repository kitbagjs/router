import { inject, InjectionKey } from 'vue'
import { RouterNotInstalledError } from '@/errors/routerNotInstalledError'
import { RouterNavigationStores } from '@/services/createRouterNavigation'
import { createRouterKeyStore } from '@/services/createRouterKeyStore'
import { Router } from '@/types/router'

export const getRouterNavigationInjectionKey = createRouterKeyStore<RouterNavigationStores>()

type UseRouterNavigation = () => RouterNavigationStores

export function createUseRouterNavigation<TRouter extends Router>(routerKey: InjectionKey<TRouter>): UseRouterNavigation {
  const routerNavigationKey = getRouterNavigationInjectionKey(routerKey)

  return (): RouterNavigationStores => {
    const navigation = inject(routerNavigationKey)

    if (!navigation) {
      throw new RouterNotInstalledError()
    }

    return navigation
  }
}
