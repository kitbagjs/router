import { InjectionKey, inject } from 'vue'
import { RouterNotInstalledError } from '@/errors/routerNotInstalledError'
import { Router } from '@/types/router'
import { isRouter } from '@/types/routerInternal'
import { isHydrating } from '@/utilities/isHydrating'

export function createUseRouter<TRouter extends Router>(routerKey: InjectionKey<TRouter>): () => TRouter {
  return () => {
    const router = inject(routerKey)

    if (!router) {
      throw new RouterNotInstalledError()
    }

    if (isRouter(router) && isHydrating()) {
      router.onHydrate()
    }

    return router
  }
}
