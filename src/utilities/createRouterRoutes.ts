import { markRaw } from 'vue'
import { DuplicateParamsError } from '@/errors'
import { ParentRoute, Route, RouterRoute, isParentRoute } from '@/types'
import { checkDuplicateKeys } from '@/utilities/checkDuplicateKeys'
import { CombineName, combineName } from '@/utilities/combineName'
import { CombinePath, combinePath } from '@/utilities/combinePath'
import { CombineQuery, combineQuery } from '@/utilities/combineQuery'
import { Path, ToPath, toPath } from '@/utilities/path'
import { Query, ToQuery, toQuery } from '@/utilities/query'

export function createRoutes<const TRoutes extends Readonly<Route[]>>(routes: TRoutes): FlattenRouterRoutes<TRoutes>
export function createRoutes(routes: Readonly<Route[]>): RouterRoute[] {
  const routerRoutes = routes.reduce<RouterRoute[]>((routerRoutes, route) => {
    const routerRoute = createRouterRoute(route)

    if (isParentRoute(route) && route.children) {
      routerRoutes.push(...route.children.map(childRoute => ({
        ...childRoute,
        name: combineName(routerRoute.name, childRoute.name),
        path: combinePath(routerRoute.path, childRoute.path),
        query: combineQuery(routerRoute.query, childRoute.query),
        matches: [...childRoute.matches, routerRoute.matched],
        depth: childRoute.depth + 1,
      })))
    }

    routerRoutes.push(routerRoute)

    return routerRoutes
  }, [])

  routerRoutes.forEach(({ path, query }) => {
    const { hasDuplicates, key } = checkDuplicateKeys(path.params, query.params)
    if (hasDuplicates) {
      throw new DuplicateParamsError(key)
    }
  })

  return routerRoutes
}

function createRouterRoute(route: Route): RouterRoute {
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

type FlattenRouterRoute<
  TRoute extends Route,
  TName extends string | undefined = TRoute['name'],
  TPath extends Path = ToPath<TRoute['path']>,
  TQuery extends Query = ToQuery<TRoute['query']>,
  TDisabled extends boolean = TRoute['disabled'] extends boolean ? TRoute['disabled'] : false,
  TChildren extends RouterRoute[] = ExtractRouteChildren<TRoute>> =
  [
    RouterRoute<TName, TPath, TQuery, TDisabled>,
    ...{
      [K in keyof TChildren]: RouterRoute<
      CombineName<TName, TChildren[K]['name']>,
      CombinePath<TPath, TChildren[K]['path']>,
      CombineQuery<TQuery, TChildren[K]['query']>,
      TChildren[K]['disabled']
      >
    }
  ]

type FlattenRouterRoutes<TRoutes extends Readonly<Route[]>> = Flatten<[...{
  [K in keyof TRoutes]: FlattenRouterRoute<TRoutes[K]>
}]>

type ExtractRouteChildren<TRoute extends Route> = TRoute extends ParentRoute
  ? TRoute['children'] extends RouterRoute[]
    ? TRoute['children']
    : []
  : []

type Flatten<T extends any[]> = T extends [infer First, ...infer Rest]
  ? First extends unknown[]
    ? Flatten<[...First, ...Flatten<Rest>]>
    : [First, ...Flatten<Rest>]
  : []