import { InjectionKey, inject } from 'vue'
import { RouterNotInstalledError } from '@/errors'
import { Router } from '@/types'

export function createUseRouter<TRouter extends Router>(routerKey: InjectionKey<TRouter>): () => TRouter {
  return () => {
    const router = inject(routerKey)

    if (!router) {
      throw new RouterNotInstalledError()
    }

    return router
  }
}
