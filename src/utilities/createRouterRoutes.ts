import { markRaw } from 'vue'
import { DuplicateParamsError } from '@/errors'
import { ParentRouteProps, RouteProps, Route, isParentRoute } from '@/types'
import { checkDuplicateKeys } from '@/utilities/checkDuplicateKeys'
import { CombineName, combineName } from '@/utilities/combineName'
import { CombinePath, combinePath } from '@/utilities/combinePath'
import { CombineQuery, combineQuery } from '@/utilities/combineQuery'
import { Path, ToPath, toPath } from '@/utilities/path'
import { Query, ToQuery, toQuery } from '@/utilities/query'

export function createRoutes<const TRoutes extends Readonly<RouteProps[]>>(routes: TRoutes): FlattenRoutes<TRoutes>
export function createRoutes(routesProps: Readonly<RouteProps[]>): Route[] {
  const routes = routesProps.reduce<Route[]>((routes, routeProps) => {
    const route = createRoute(routeProps)

    if (isParentRoute(routeProps) && routeProps.children) {
      routes.push(...routeProps.children.map(childRoute => ({
        ...childRoute,
        name: combineName(route.name, childRoute.name),
        path: combinePath(route.path, childRoute.path),
        query: combineQuery(route.query, childRoute.query),
        matches: [...childRoute.matches, route.matched],
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
  const rawRoute = markRaw(route)

  return {
    matched: rawRoute,
    matches: [rawRoute],
    name: route.name,
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
  TName extends string | undefined = TRoute['name'],
  TPath extends Path = ToPath<TRoute['path']>,
  TQuery extends Query = ToQuery<TRoute['query']>,
  TDisabled extends boolean = TRoute['disabled'] extends boolean ? TRoute['disabled'] : false,
  TChildren extends Route[] = ExtractRouteChildren<TRoute>> =
  [
    Route<TName, TPath, TQuery, TDisabled>,
    ...{
      [K in keyof TChildren]: Route<
      CombineName<TName, TChildren[K]['name']>,
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