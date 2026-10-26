import { inject, InjectionKey, onScopeDispose } from 'vue'
import { createRouterKeyStore } from '@/services/createRouterKeyStore'
import { Router } from '@/types/router'

export type RouterSuspenseContext = {
  reportError: (error: unknown) => boolean,
}

export const getRouterSuspenseInjectionKey = createRouterKeyStore<RouterSuspenseContext>()

type ReportRouterError = (error: unknown) => boolean

export function createUseRouterSuspense(routerKey: InjectionKey<Router>): () => ReportRouterError {
  const key = getRouterSuspenseInjectionKey(routerKey)

  return () => {
    const boundary = inject(key, undefined)
    let active = true

    onScopeDispose(() => {
      active = false
    })

    return (error) => {
      if (!active) {
        return false
      }

      return boundary?.reportError(error) ?? false
    }
  }
}
