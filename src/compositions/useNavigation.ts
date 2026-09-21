import { InjectionKey, inject } from 'vue'
import { RouterNotInstalledError } from '@/errors/routerNotInstalledError'
import { createRouterKeyStore } from '@/services/createRouterKeyStore'
import { NavigationProgressState } from '@/services/createNavigationProgress'
import { UseNavigation } from '@/types/navigation'
import { Router } from '@/types/router'

export const getNavigationProgressKey = createRouterKeyStore<NavigationProgressState>()

export function createUseNavigationProgressState(routerKey: InjectionKey<Router>): () => NavigationProgressState {
  const progressKey = getNavigationProgressKey(routerKey)

  return () => {
    const progress = inject(progressKey)

    if (!progress) {
      throw new RouterNotInstalledError()
    }

    return progress
  }
}

export function createUseNavigation<TRouter extends Router>(routerKey: InjectionKey<TRouter>): () => UseNavigation {
  const useNavigationProgressState = createUseNavigationProgressState(routerKey)

  return () => {
    const { pending, to, from } = useNavigationProgressState()

    return {
      pending,
      to,
      from,
    }
  }
}
