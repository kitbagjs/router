import { RouterNotInstalledError } from '@/errors/routerNotInstalledError'
import { getRouterHooksKey, RouterHooks } from '@/services/createRouterHooks'
import { Router } from '@/types/router'
import { inject, InjectionKey } from 'vue'

export function createUseRouterHooks<TRouter extends Router>(key: InjectionKey<TRouter>) {
  const routerHooksKey = getRouterHooksKey(key)

  return (): RouterHooks => {
    const hooks = inject(routerHooksKey)

    if (!hooks) {
      throw new RouterNotInstalledError()
    }

    return hooks
  }
}
