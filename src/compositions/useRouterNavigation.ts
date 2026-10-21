import { inject, InjectionKey } from 'vue'
import { RouterNotInstalledError } from '@/errors/routerNotInstalledError'
import { Navigation } from '@/services/createNavigation'
import { createRouterKeyStore } from '@/services/createRouterKeyStore'
import { Router } from '@/types/router'

export const getRouterNavigationInjectionKey = createRouterKeyStore<Navigation>()

type UseRouterNavigation = () => Navigation

export function createUseRouterNavigation<TRouter extends Router>(routerKey: InjectionKey<TRouter>): UseRouterNavigation {
  const routerNavigationKey = getRouterNavigationInjectionKey(routerKey)

  return (): Navigation => {
    const navigation = inject(routerNavigationKey)

    if (!navigation) {
      throw new RouterNotInstalledError()
    }

    return navigation
  }
}
