import { inject, InjectionKey, Ref } from 'vue'
import { Navigation } from '@/services/createNavigation'
import { RouterNotInstalledError } from '@/errors/routerNotInstalledError'
import { RouterNavigation } from '@/services/createRouterNavigation'
import { createRouterKeyStore } from '@/services/createRouterKeyStore'
import { Router } from '@/types/router'

export const getViewNavigationKey = createRouterKeyStore<Readonly<Ref<Navigation | null>>>()

export const getRouterNavigationInjectionKey = createRouterKeyStore<RouterNavigation>()

type UseRouterNavigation = () => RouterNavigation

export function createUseRouterNavigation<TRouter extends Router>(routerKey: InjectionKey<TRouter>): UseRouterNavigation {
  const routerNavigationKey = getRouterNavigationInjectionKey(routerKey)

  return (): RouterNavigation => {
    const navigation = inject(routerNavigationKey)

    if (!navigation) {
      throw new RouterNotInstalledError()
    }

    return navigation
  }
}
