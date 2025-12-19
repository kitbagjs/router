import { RouteHooks } from '@/models/RouteHooks'
import { ResolvedRoute } from '@/types/resolved'

export function getBeforeRouteHooksFromRoutes(to: ResolvedRoute, from: ResolvedRoute | null): RouteHooks {
  throw new Error('Not implemented')
}

export function getAfterRouteHooksFromRoutes(to: ResolvedRoute, from: ResolvedRoute | null): RouteHooks {
  throw new Error('Not implemented')
}
