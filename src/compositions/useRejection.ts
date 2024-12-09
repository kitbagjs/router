import { InjectionKey, inject } from 'vue'
import { RouterNotInstalledError } from '@/errors'
import { RouterRejection } from '@/services/createRouterReject'

export const routerRejectionKey: InjectionKey<RouterRejection> = Symbol()

export function useRejection(): RouterRejection {
  const rejection = inject(routerRejectionKey)

  if (!rejection) {
    throw new RouterNotInstalledError()
  }

  return rejection
}
