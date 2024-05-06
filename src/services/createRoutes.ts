import { markRaw } from 'vue'
import RouterView from '@/components/routerView.vue'
import { DuplicateParamsError } from '@/errors'
import { CombineName, combineName } from '@/services/combineName'
import { CombinePath, combinePath } from '@/services/combinePath'
import { CombineQuery, combineQuery } from '@/services/combineQuery'
import { Path, ToPath, toPath } from '@/types/path'
import { Query, ToQuery, toQuery } from '@/types/query'
import { Route } from '@/types/route'
import { ParentRouteProps, RouteProps, isParentRoute } from '@/types/routeProps'
import { checkDuplicateKeys } from '@/utilities/checkDuplicateKeys'

/**
 * Creates an array of routes from a defined set of route properties, handling hierarchical route combinations.
 * This function also validates for duplicate parameter keys across the combined routes.
 *
 * @param routesProps - An array of route properties used to configure and create routes.
 * @returns An array of fully configured Route instances.
 */
export function createRoutes<const TRoutes extends Readonly<RouteProps[]>>(routes: TRoutes): FlattenRoutes<TRoutes>
export function createRoutes(routesProps: Readonly<RouteProps[]>): Route[] {
  const routes = routesProps.reduce<Route[]>((routes, routeProps) => {
    const route = createRoute({
      ...routeProps,
      component: routeProps.component ?? RouterView,
    })

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

  routes.forEach(({ path, query }) => {
    const { hasDuplicates, key } = checkDuplicateKeys(path.params, query.params)
    if (hasDuplicates) {
      throw new DuplicateParamsError(key)
    }
  })

  return routes
}

function createRoute(route: RouteProps): Route {
  const path = toPath(route.path)
  const query = toQuery(route.query)
  const rawRoute = markRaw({ meta: {}, ...route })

  return {
    matched: rawRoute,
    matches: [rawRoute],
    key: route.name,
    path,
    query,
    pathParams: path.params,
    queryParams: query.params,
    depth: 1,
    disabled: route.disabled ?? false,
  }
}

type FlattenRoute<
  TRoute extends RouteProps,
  TKey extends string | undefined = TRoute['name'],
  TPath extends Path = ToPath<TRoute['path']>,
  TQuery extends Query = ToQuery<TRoute['query']>,
  TDisabled extends boolean = TRoute['disabled'] extends boolean ? TRoute['disabled'] : false,
  TChildren extends Route[] = ExtractRouteChildren<TRoute>> =
  [
    Route<TKey, TPath, TQuery, TDisabled>,
    ...{
      [K in keyof TChildren]: Route<
      CombineName<TKey, TChildren[K]['key']>,
      CombinePath<TPath, TChildren[K]['path']>,
      CombineQuery<TQuery, TChildren[K]['query']>,
      TChildren[K]['disabled']
      >
    }
  ]

type FlattenRoutes<TRoutes extends Readonly<RouteProps[]>> = Flatten<[...{
  [K in keyof TRoutes]: FlattenRoute<TRoutes[K]>
}]>

type ExtractRouteChildren<TRoute extends RouteProps> = TRoute extends ParentRouteProps
  ? TRoute['children'] extends Route[]
    ? TRoute['children']
    : []
  : []

type Flatten<T extends any[]> = T extends [infer First, ...infer Rest]
  ? First extends unknown[]
    ? Flatten<[...First, ...Flatten<Rest>]>
    : [First, ...Flatten<Rest>]
  : []