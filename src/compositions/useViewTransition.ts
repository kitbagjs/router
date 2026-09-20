import { InjectionKey } from 'vue'
import { createUseRouter } from '@/compositions/useRouter'
import { Router } from '@/types/router'

export function createUseViewTransition<TRouter extends Router>(routerKey: InjectionKey<TRouter>): () => TRouter['viewTransition'] {
  const useRouter = createUseRouter(routerKey)

  return () => useRouter().viewTransition
}
