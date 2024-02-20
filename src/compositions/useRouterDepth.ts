import { inject } from 'vue'
import { depthInjectionKey } from '@/components/routerView'

export function useRouterDepth(): number {
  return inject(depthInjectionKey, 0)
}