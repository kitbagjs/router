import { inject } from 'vue'
import { Router } from '@/types/router'
import { routerInjectionKey } from '@/utilities'

export function useRouter(): Router {
  const router = inject(routerInjectionKey)

  if (!router) {
    throw new Error('Router is not installed')
  }

  // any prevents typescript from trying to verify the types are compatible
  return router as any
}