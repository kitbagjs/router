import { markRaw } from 'vue'
import RouterView from '@/components/routerView.vue'
import { combineName } from '@/services/combineName'
import { combinePath } from '@/services/combinePath'
import { combineQuery } from '@/services/combineQuery'
import { host } from '@/services/host'
import { FlattenRoutes } from '@/types/flattenRoutes'
import { toPath } from '@/types/path'
import { toQuery } from '@/types/query'
import { Route } from '@/types/route'
import { RouteProps, isParentRoute, isParentRouteWithoutComponent } from '@/types/routeProps'
import { checkDuplicateKeys } from '@/utilities/checkDuplicateKeys'

/**
 * Creates an array of routes from a defined set of route properties, handling hierarchical route combinations.
 * This function also validates for duplicate parameter keys across the combined routes.
 *
 * @param routesProps - An array of route properties used to configure and create routes.
 * @returns An array of fully configured Route instances.
 */
export function createRoutes<const TRoutes extends RouteProps[]>(routes: TRoutes): FlattenRoutes<TRoutes>
export function createRoutes(routesProps: RouteProps[]): Route[] {
  const routes = routesProps.reduce<Route[]>((routes, routeProps) => {
    const route = createRoute(routeProps)

    if (isParentRoute(routeProps)) {
      routes.push(...routeProps.children.map(childRoute => ({
        ...childRoute,
        key: combineName(route.key, childRoute.key),
        path: combinePath(route.path, childRoute.path),
        query: combineQuery(route.query, childRoute.query),
        matches: [route.matched, ...childRoute.matches],
        depth: childRoute.depth + 1,
      })))
    }

    routes.push(route)

    return routes
  }, [])

  throwIfDuplicateParamsAreFound(routes)

  return routes
}

function createRoute(route: RouteProps): Route {
  const routeWithComponent = addRouterViewComponentIfParentWithoutComponent(route)
  const path = toPath(route.path)
  const query = toQuery(route.query)
  const rawRoute = markRaw({ meta: {}, ...routeWithComponent })

  return {
    matched: rawRoute,
    matches: [rawRoute],
    key: route.name ?? '',
    path,
    query,
    depth: 1,
    disabled: route.disabled ?? false,
    host: host('', {}),
  }
}

export function throwIfDuplicateParamsAreFound(routes: Route[]): void {
  routes.forEach(({ path, query, host }) => {
    checkDuplicateKeys(path.params, query.params, host.params)
  })
}

function addRouterViewComponentIfParentWithoutComponent(route: RouteProps): RouteProps {
  if (isParentRouteWithoutComponent(route)) {
    return { ...route, component: RouterView }
  }

  return route
}
