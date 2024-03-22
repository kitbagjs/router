import { inject } from 'vue'
import { RouterNotInstalledError } from '@/errors/routerNotInstalledError'
import { RouteHookStore } from '@/models/RouteHookStore'
import { routeHookStoreKey } from '@/utilities/createRouterHooks'

export function useRouteHooks(): RouteHookStore {
  const hooks = inject(routeHookStoreKey)

  if (!hooks) {
    throw new RouterNotInstalledError()
  }

  return hooks
}