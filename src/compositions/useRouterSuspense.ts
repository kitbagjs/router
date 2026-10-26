import { createRouterKeyStore } from '@/services/createRouterKeyStore'

export type RouterSuspenseContext = {
  reportError: (error: unknown) => boolean,
}

export const getRouterSuspenseInjectionKey = createRouterKeyStore<RouterSuspenseContext>()
