import { InjectionKey } from 'vue'
import { createUseRouterNavigation } from '@/compositions/useRouterNavigation'
import { UseNavigation } from '@/types/navigation'
import { Router } from '@/types/router'

export function createUseNavigation<TRouter extends Router>(routerKey: InjectionKey<TRouter>): () => UseNavigation {
  const useRouterNavigation = createUseRouterNavigation(routerKey)

  return () => {
    const navigation = useRouterNavigation()

    return navigation.progress
  }
}
