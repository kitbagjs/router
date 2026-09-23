import { InjectionKey, inject } from 'vue'
import { RouterNotInstalledError } from '@/errors/routerNotInstalledError'
import { createRouterKeyStore } from '@/services/createRouterKeyStore'
import { UseNavigation } from '@/types/navigation'
import { Router } from '@/types/router'

export const getNavigationProgressKey = createRouterKeyStore<UseNavigation>()

export function createUseNavigation<TRouter extends Router>(routerKey: InjectionKey<TRouter>): () => UseNavigation {
  const navigationProgressKey = getNavigationProgressKey(routerKey)

  return () => {
    const navigationProgress = inject(navigationProgressKey)

    if (!navigationProgress) {
      throw new RouterNotInstalledError()
    }

    const { pending, to, from, settled, total, progress } = navigationProgress

    return {
      pending,
      to,
      from,
      settled,
      total,
      progress,
    }
  }
}
