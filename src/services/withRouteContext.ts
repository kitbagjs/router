import { Route } from '@/types/route'
import { RouteContext } from '@/types/routeContext'
import { getHooks } from '@/types/hooks'

/**
 * Keeps a route's context in sync with its matches and shared hook stores.
 */
export function withRouteContext<TRoute extends Route>(route: TRoute): TRoute {
  return {
    ...route,
    get context(): RouteContext[] {
      return [
        ...route.matches.flatMap((match) => match.context ?? []),
        ...getHooks(route).flatMap((store) => store.context),
      ]
    },
  }
}
