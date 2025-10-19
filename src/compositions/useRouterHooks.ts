import { RouterNotInstalledError } from '@/errors/routerNotInstalledError'
import { getRouterHooksKey, RouterHooks } from '@/services/createRouterHooks'
import { Router, RouterRoutes } from '@/types/router'
import { inject, InjectionKey } from 'vue'

export function createUseRouterHooks<TRouter extends Router>(routerKey: InjectionKey<TRouter>) {
  const routerHooksKey = getRouterHooksKey(routerKey)

  return (): RouterHooks<RouterRoutes<TRouter>> => {
    const hooks = inject(routerHooksKey)

    if (!hooks) {
      throw new RouterNotInstalledError()
    }

    return hooks
  }
}
