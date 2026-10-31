import { getMatchedLoaders } from '@/services/getMatchedLoaders'
import { ResolvedRoute } from '@/types/resolved'
import { RouteLoaders } from '@/types/routeLoaders'

export function getRouteLoaders(route: ResolvedRoute): RouteLoaders {
  const entries = getMatchedLoaders(route.matches).map(({ loader, location }) => [location.name, loader])

  return Object.fromEntries(entries)
}
