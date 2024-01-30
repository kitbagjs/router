import { InjectionKey, inject } from 'vue'
import { RouterRejectionComponent } from '@/utilities/createRouterReject'

export const routerRejectionKey: InjectionKey<RouterRejectionComponent> = Symbol()

export function useRejection(): RouterRejectionComponent {
  const rejection = inject(routerRejectionKey)

  if (!rejection) {
    throw new Error('Router is not installed')
  }

  return rejection
}