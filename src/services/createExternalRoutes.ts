import { markRaw } from 'vue'
import { combineName } from '@/services/combineName'
import { combinePath } from '@/services/combinePath'
import { combineQuery } from '@/services/combineQuery'
import { throwIfDuplicateParamsAreFound } from '@/services/createRoutes'
import { ExternalRouteProps } from '@/types/externalRouteProps'
import { FlattenRoutes } from '@/types/flattenRoutes'
import { toPath } from '@/types/path'
import { toQuery } from '@/types/query'
import { Route } from '@/types/route'

export function createExternalRoutes<const TRoutes extends ExternalRouteProps[]>(routes: TRoutes): FlattenRoutes<TRoutes>
export function createExternalRoutes(routesProps: ExternalRouteProps[]): Route[] {
  const routes = routesProps.reduce<Route[]>((routes, routeProps) => {
    const route = createExternalRoute(routeProps)

    if (routeProps.children) {
      routes.push(...routeProps.children.map(childRoute => ({
        ...childRoute,
        key: combineName(route.key, childRoute.key),
        path: combinePath(route.path, childRoute.path),
        query: combineQuery(route.query, childRoute.query),
        matches: [route.matched, ...childRoute.matches],
        depth: childRoute.depth + 1,
        host: routeProps.host ?? '',
      })))
    }

    routes.push(route)

    return routes
  }, [])

  throwIfDuplicateParamsAreFound(routes)

  return routes
}

/**
 * Transforms ExternalRouteProps into a Route.
 * The matches and matched properties are coerced to match the expected type but are otherwise unused
 * and show never be provided to the end user.
 */
function createExternalRoute(route: ExternalRouteProps): Route {
  const path = toPath(route.path)
  const query = toQuery(route.query)
  const rawRoute = markRaw({ meta: {}, ...route, name: route.name ?? '', children: [] })

  return {
    matched: rawRoute,
    matches: [],
    key: route.name ?? '',
    path,
    query,
    depth: 1,
    disabled: route.disabled ?? false,
    host: route.host ?? '',
  }
}