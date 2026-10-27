import { ComponentPublicInstance } from 'vue'
import { createRouterKeyStore } from '@/services/createRouterKeyStore'

export type RouterSuspenseContext = {
  captureError: (error: unknown, source: ComponentPublicInstance | null) => false | void,
  reportError: (error: unknown) => boolean,
}

export const getRouterSuspenseInjectionKey = createRouterKeyStore<RouterSuspenseContext>()
