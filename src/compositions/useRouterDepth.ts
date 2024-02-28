import { inject } from 'vue'
import { depthInjectionKey } from '@/types'

export function useRouterDepth(): number {
  return inject(depthInjectionKey, 0)
}