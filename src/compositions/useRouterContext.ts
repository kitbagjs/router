import { InjectionKey } from 'vue'
import { Router } from '@/types/router'
import { createUseRouter } from '@/compositions/useRouter'

export function createUseRouterContext<TRouter extends Router>(routerKey: InjectionKey<TRouter>): () => TRouter['context'] {
  const useRouter = createUseRouter(routerKey)

  return () => useRouter().context
}
