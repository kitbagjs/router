import { Router } from '@/types/router'
import { RouteContext } from '@/types/routeContext'

export const IS_ROUTER_SYMBOL = Symbol('IS_ROUTER_SYMBOL')

export type RouterInternal = {
  [IS_ROUTER_SYMBOL]: true,
  addContext: (context: readonly RouteContext[]) => void,
}

export function isRouter(value: unknown): value is Router & RouterInternal {
  return typeof value === 'object' && value !== null && IS_ROUTER_SYMBOL in value
}
