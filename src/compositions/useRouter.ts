import { inject } from 'vue'
import { Router } from '@/types/router'
import { routerInjectionKey } from '@/utilities'

export function useRouter(): Router {
  const router = inject(routerInjectionKey)

  if (!router) {
    throw new Error('Router is not installed')
  }

  return router
}