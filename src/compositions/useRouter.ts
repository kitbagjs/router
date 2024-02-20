import { InjectionKey, inject } from 'vue'
import { RouterNotInstalledError } from '@/errors/routerNotInstalledError'
import { RegisteredRouter } from '@/types'

export const routerInjectionKey: InjectionKey<RegisteredRouter> = Symbol()

export function useRouter(): RegisteredRouter {
  const router = inject(routerInjectionKey)

  if (!router) {
    throw new RouterNotInstalledError()
  }

  return router
}