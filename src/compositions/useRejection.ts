import { InjectionKey, inject } from 'vue'
import { RouterRejection } from '@/services/createRouterReject'

export const routerRejectionKey: InjectionKey<RouterRejection> = Symbol()

export function useRejection(): RouterRejection {
  const rejection = inject(routerRejectionKey)

  if (!rejection) {
    throw new Error('Router is not installed')
  }

  return rejection
}