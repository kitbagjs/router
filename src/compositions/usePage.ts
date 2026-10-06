import { InjectionKey, ShallowRef, inject } from 'vue'
import { Router } from '@/types/router'
import { Page } from '@/types/page'
import { createRouterKeyStore } from '@/services/createRouterKeyStore'
import { RouterNotInstalledError } from '@/errors/routerNotInstalledError'

export const getPageKey = createRouterKeyStore<ShallowRef<Page | null>>()

/** Internal display state; the public useRoute and useRejection remain separate projections. */
export function createUsePage(routerKey: InjectionKey<Router>): () => ShallowRef<Page | null> {
  const key = getPageKey(routerKey)

  return () => {
    const page = inject(key)

    if (!page) {
      throw new RouterNotInstalledError()
    }

    return page
  }
}
