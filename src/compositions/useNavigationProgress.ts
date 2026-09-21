import { InjectionKey } from 'vue'
import { createUseNavigationProgressState } from '@/compositions/useNavigation'
import { UseNavigationProgress } from '@/types/navigation'
import { Router } from '@/types/router'

export function createUseNavigationProgress<TRouter extends Router>(routerKey: InjectionKey<TRouter>): () => UseNavigationProgress {
  const useNavigationProgressState = createUseNavigationProgressState(routerKey)

  return () => {
    const { pending, settled, total, progress } = useNavigationProgressState()

    return {
      pending,
      settled,
      total,
      progress,
    }
  }
}
