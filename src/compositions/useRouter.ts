import { InjectionKey, inject } from 'vue'
import { RouterNotInstalledError } from '@/errors/routerNotInstalledError'
import { Router } from '@/types/router'
import { useHydrationDetection } from '@/compositions/useHydrationDetection'

export function createUseRouter<TRouter extends Router>(routerKey: InjectionKey<TRouter>): () => TRouter {
  return () => {
    const router = inject(routerKey)

    if (!router) {
      throw new RouterNotInstalledError()
    }

    useHydrationDetection(router)

    return router
  }
}
