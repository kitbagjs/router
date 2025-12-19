import { RouterRouteHooks } from '@/models/RouterRouteHooks'
import { Param } from '@/types/paramTypes'

export type CombineRouteHooks<
  TParent extends Record<string, Param>,
  TChild extends Record<string, Param>
> = TParent & TChild

export function combineRouteHooks(parentRouteHooks: RouterRouteHooks, childRouteHooks: RouterRouteHooks): RouterRouteHooks {
  return new RouterRouteHooks(parentRouteHooks, childRouteHooks)
}
