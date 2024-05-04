import { inject } from 'vue'
import { depthInjectionKey } from '@/types/injectionDepth'

export function useRouterDepth(): number {
  return inject(depthInjectionKey, 0)
}