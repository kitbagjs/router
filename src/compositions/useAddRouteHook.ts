import { inject } from 'vue'
import { RouterNotInstalledError } from '@/errors/routerNotInstalledError'
import { RouterAddRouteHook, addRouteHookInjectionKey } from '@/utilities/createRouterHooks'

export function useAddRouteHook(): RouterAddRouteHook {
  const addRouteHook = inject(addRouteHookInjectionKey)

  if (!addRouteHook) {
    throw new RouterNotInstalledError()
  }

  return addRouteHook
}