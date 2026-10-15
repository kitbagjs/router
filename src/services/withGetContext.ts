import { getRouteContext } from '@/services/getRouteContext'
import { Route } from '@/types/route'
import { GetContext } from '@/types/routeContext'

/**
 * Attaches a context callback that captures this route copy.
 */
export function withGetContext<TRoute extends Route>(route: TRoute): TRoute & { getContext: GetContext } {
  return {
    ...route,
    getContext: () => getRouteContext(route),
  }
}
