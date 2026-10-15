import { Route } from '@/types/route'
import { RouteContext } from '@/types/routeContext'
import { getHooks } from '@/types/hooks'

/**
 * Keeps a route's context in sync with its shared hook stores.
 */
export function withRouteContext<TRoute extends Route>(route: TRoute): TRoute {
  const context = route.context
  const stores = getHooks(route)

  return {
    ...route,
    get context(): RouteContext[] {
      for (const store of stores) {
        for (const target of store.context) {
          if (!context.includes(target)) {
            context.push(target)
          }
        }
      }

      return context
    },
  }
}
