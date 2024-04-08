import { markRaw } from 'vue'
import { DuplicateParamsError } from '@/errors'
import { MergeParams, ParentRoute, Route, RouterRoute, isParentRoute } from '@/types'
import { Path, path as createPath, PathParams, ToPath, toPath } from '@/utilities/path'
import { Query, QueryParams, ToQuery, query as createQuery, toQuery } from '@/utilities/query'

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

function checkDuplicateKeys(path: Record<string, unknown>, query: Record<string, unknown>): { key: string, hasDuplicates: true } | { key: undefined, hasDuplicates: false } {
  const pathKeys = Object.keys(path)
  const queryKeys = Object.keys(query)
  const duplicateKey = pathKeys.find(key => queryKeys.includes(key))

  if (duplicateKey) {
    return {
      key: duplicateKey,
      hasDuplicates: true,
    }
  }

  return {
    key: undefined,
    hasDuplicates: false,
  }
}

type FlattenRouterRoute<TRoute extends Route, TChildren extends RouterRoute[] = ExtractRouteChildren<TRoute>> = [
  RouterRoute<TRoute['name'], ToPath<TRoute['path']>, TRoute extends { query: any } ? ToQuery<TRoute['query']> : Query<string, {}>>,
  ...{ [K in keyof TChildren]: RouterRoute<
  CombineName<TRoute['name'], TChildren[K]['name']>,
  CombinePath<ToPath<TRoute['path']>, TChildren[K]['path']>,
  CombineQuery<ToQuery<TRoute['query']>, TChildren[K]['query']>
  > }
]

type FlattenRouterRoutes<TRoutes extends Readonly<Route[]>> = Flatten<[...{
  [K in keyof TRoutes]: FlattenRouterRoute<TRoutes[K]>
}]>

type CombineName<TParentName extends string | undefined, TChildName extends string | undefined> = TParentName extends string
  ? TChildName extends string
    ? `${TParentName}.${TChildName}`
    : TParentName
  : TChildName extends string
    ? TChildName
    : ''

function combineName<TParentName extends string | undefined, TChildName extends string | undefined>(parentName: TParentName, childName: TChildName): CombineName<TParentName, TChildName>
function combineName(parentName: string, childName: string): string {
  return [parentName, childName].filter(value => !!value).join('.')
}

type CombinePath<
  TParent extends Path,
  TChild extends Path
> = ToPath<TParent> extends { path: infer TParentPath extends string, params: infer TParentParams extends Record<string, unknown> }
  ? ToPath<TChild> extends { path: infer TChildPath extends string, params: infer TChildParams extends Record<string, unknown> }
    ? MergeParams<TParentParams, TChildParams> extends PathParams<`${TParentPath}${TChildPath}`>
      ? Path<`${TParentPath}${TChildPath}`, MergeParams<TParentParams, TChildParams>>
      : Path<'', {}>
    : Path<'', {}>
  : Path<'', {}>

function combinePath<TParentPath extends Path, TChildPath extends Path>(parentPath: TParentPath, childPath: TChildPath): CombinePath<TParentPath, TChildPath>
function combinePath(parentPath: Path, childPath: Path): Path {
  const { hasDuplicates, key } = checkDuplicateKeys(parentPath.params, childPath.params)
  if (hasDuplicates) {
    throw new DuplicateParamsError(key)
  }

  return createPath(`${parentPath.path}${childPath.path}`, { ...parentPath.params, ...childPath.params })
}

type CombineQuery<
  TParent extends Query | undefined,
  TChild extends Query | undefined
> = ToQuery<TParent> extends { query: infer TParentQuery extends string, params: infer TParentParams extends Record<string, unknown> }
  ? ToQuery<TChild> extends { query: infer TChildQuery extends string, params: infer TChildParams extends Record<string, unknown> }
    ? MergeParams<TParentParams, TChildParams> extends QueryParams<`${TParentQuery}${TChildQuery}`>
      ? Query<`${TParentQuery}${TChildQuery}`, MergeParams<TParentParams, TChildParams>>
      : Query<'', {}>
    : Query<'', {}>
  : Query<'', {}>

function combineQuery<TParentQuery extends Query, TChildQuery extends Query>(parentQuery: TParentQuery, childQuery: TChildQuery): CombineQuery<TParentQuery, TChildQuery>
function combineQuery(parentQuery: Query, childQuery: Query): Query {
  const { hasDuplicates, key } = checkDuplicateKeys(parentQuery.params, childQuery.params)
  if (hasDuplicates) {
    throw new DuplicateParamsError(key)
  }

  return createQuery(`${parentQuery.query}${childQuery.query}`, { ...parentQuery.params, ...childQuery.params })
}

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