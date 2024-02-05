import { InjectionKey, inject } from 'vue'
import { RegisteredRouter } from '@/types'

export const routerInjectionKey: InjectionKey<RegisteredRouter> = Symbol()

export function useRouter(): RegisteredRouter {
  const router = inject(routerInjectionKey)

  if (!router) {
    throw new Error('Router is not installed')
  }

  return router
}