import { ComponentPublicInstance, getCurrentInstance, inject, InjectionKey, onScopeDispose } from 'vue'
import { createRouterKeyStore } from '@/services/createRouterKeyStore'
import { Router } from '@/types/router'

export type RouterSuspenseErrorKind = 'props' | 'loader'

export type RouterSuspenseContext = {
  captureError: (error: unknown, source: ComponentPublicInstance | null) => false | void,
  reportError: (error: unknown, kind: RouterSuspenseErrorKind, source?: ComponentPublicInstance | null) => boolean,
}

export const getRouterSuspenseInjectionKey = createRouterKeyStore<RouterSuspenseContext>()

type ReportRouterError = (error: unknown, options?: { rethrow: boolean }) => boolean

export function createUseRouterSuspense(routerKey: InjectionKey<Router>): (kind: RouterSuspenseErrorKind) => ReportRouterError {
  const key = getRouterSuspenseInjectionKey(routerKey)

  return (kind) => {
    const boundary = inject(key, undefined)
    const source = getCurrentInstance()?.proxy ?? null
    let active = true

    onScopeDispose(() => {
      active = false
    })

    return (error, options) => {
      if (!active) {
        return false
      }

      return boundary?.reportError(error, kind, options?.rethrow ? source : undefined) ?? false
    }
  }
}
