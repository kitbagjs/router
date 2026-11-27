import { Router } from '@/types/router'
import { RouteContext } from '@/types/routeContext'

export const IS_ROUTER_SYMBOL = Symbol('IS_ROUTER_SYMBOL')

export type RouterInternal = {
  [IS_ROUTER_SYMBOL]: true,
  addContext: (context: readonly RouteContext[]) => void,
  /**
   * Commits the initial route synchronously for markup that is hydrating without a payload, and warns
   * that the payload is missing. Only the first call does anything.
   */
  hydrate: () => void,
}

export function isRouter(value: unknown): value is Router & RouterInternal {
  return typeof value === 'object' && value !== null && IS_ROUTER_SYMBOL in value
}
