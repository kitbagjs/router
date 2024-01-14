import { inject } from 'vue'
import { RegisteredRouter } from '@/types'
import { routerInjectionKey } from '@/utilities'

export function useRouter(): RegisteredRouter {
  const router = inject(routerInjectionKey)

  if (!router) {
    throw new Error('Router is not installed')
  }

  return router
}