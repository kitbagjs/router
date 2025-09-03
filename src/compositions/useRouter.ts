import { InjectionKey, inject } from 'vue'
import { RouterNotInstalledError } from '@/errors'
import { Router } from '@/types'

export function createUseRouter<T extends Router>(routerKey: InjectionKey<T>): () => T {
  return () => {
    const router = inject(routerKey)

    if (!router) {
      throw new RouterNotInstalledError()
    }

    return router
  }
}
