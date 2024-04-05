import { Component } from 'vue'
import { ExtractPathParamType, Identity, MergeParams, Param, Route, isNamedRoute } from '@/types'
import { createRouterRoute } from '@/utilities/createRouterRoute'
import { Path, path as createPath, PathParams, path, ToPath } from '@/utilities/path'
import { Query, QueryParams, ToQuery, query as createQuery, query } from '@/utilities/query'
import { component } from '@/utilities/testHelpers'

export function createRoute<
  TName extends string | undefined,
  TPath extends string | Path,
  TQuery extends string | Query
>(route: {
  name: TName,
  path: TPath,
  query: TQuery,
}) {
  throw 'not implements'
}

// return type will use generics, will need to combine children
// function createParentRoute<
//   TName extends string | undefined,
//   TPath extends string | Path,
//   TQuery extends string | Query
//   TChildren extends
// >(route: {
//   name: TName,
//   path: TPath,
//   query: TQuery,
// }) {

// }

// user land (input)
type FutureRoute = (Omit<Route, 'children'> & { children?: NewRouterRoute[] })

type FlattenNewRouterRoutes<
  TName extends string | undefined,
  TPath extends Path,
  TQuery extends Query | undefined,
  TChildren extends NewRouterRoute[] | undefined
> = [NewRouterRoute<TName, TPath, TQuery>, ...(TChildren extends infer NotUndefinedChildren extends NewRouterRoute[] ? {
  [K in keyof NotUndefinedChildren]: NewRouterRoute<NotUndefinedChildren[K]['name'], CombinePath<TPath, ToPath<NotUndefinedChildren[K]['path']>>, CombineQuery<ToQuery<TQuery>, ToQuery<NotUndefinedChildren[K]['query']>>>
} : [])]

// internal version of FutureRoute (output)
type NewRouterRoute<
  TName extends string | undefined = string | undefined,
  TPath extends Path = Path,
  TQuery extends Query | undefined = Query | undefined
> = {
  matched: Route,
  matches: Route[],
  name: TName,
  path: TPath,
  query: TQuery,
  pathParams: Record<string, Param>,
  queryParams: Record<string, Param>,
  depth: number,
}

type CombinePath<
  TParent extends Path,
  TChild extends Path
> = TParent extends { path: infer TParentPath extends string, params: infer TParentParams extends Record<string, unknown> }
  ? TChild extends { path: infer TChildPath extends string, params: infer TChildParams extends Record<string, unknown> }
    ? MergeParams<TParentParams, TChildParams> extends PathParams<`${TParentPath}${TChildPath}`>
      ? Path<`${TParentPath}${TChildPath}`, MergeParams<TParentParams, TChildParams>>
      : never
    : never
  : never

type CombineQuery<
  TParent extends Query,
  TChild extends Query
> = TParent extends { query: infer TParentQuery extends string, params: infer TParentParams extends Record<string, unknown> }
  ? TChild extends { query: infer TChildQuery extends string, params: infer TChildParams extends Record<string, unknown> }
    ? MergeParams<TParentParams, TChildParams> extends QueryParams<`${TParentQuery}${TChildQuery}`>
      ? Query<`${TParentQuery}${TChildQuery}`, MergeParams<TParentParams, TChildParams>>
      : never
    : never
  : never

type NewRouterRoutes<TRoutes extends FutureRoute[]> = FlatArray<{
  [K in keyof TRoutes]: FlattenNewRouterRoutes<TRoutes[K]['name'], ToPath<TRoutes[K]['path']>, ToQuery<TRoutes[K]['query']>, TRoutes[K]['children']>
}, 0>

function createNewRouterRoutes<const TRoutes extends FutureRoute[]>(routes: TRoutes): NewRouterRoutes<TRoutes> {
  throw 'not implemented'
}

// start here, need return type to type TChildren above
function createNewRouterRoute<
  const TRoute extends FutureRoute
>(route: TRoute): FlattenNewRouterRoutes<TRoute['name'], ToPath<TRoute['path']>, ToQuery<TRoute['query']>, TRoute['children']>
function createNewRouterRoute(route: FutureRoute): [NewRouterRoute] {
  const path: Path = typeof route.path === 'string' ? createPath(route.path, {}) : route.path
  const query: Query = typeof route.query === 'string' ? createQuery(route.query, {}) : route.query ?? { query: '', params: {} }
  // const value: NewRouterRoute[] = []

  // if (isParentRoute(route)) {
  //   const routerRoute = createRouterRoutes(route.children, {
  //     parentPath: fullPath,
  //     parentQuery: fullQuery,
  //     parentMatches: fullMatches,
  //     parentDepth: parentDepth + 1,
  //   })

  //   value.push(...routerRoute)
  // }

  // value.push({
  const routerRoute = {
    matched: route,
    matches: [route],
    name: route.name,
    path,
    query,
    pathParams: extractParams([path]),
    queryParams: extractParams([query]),
    depth: 1,
  }
  // })

  return [routerRoute]
}

function extractParams(entries: Path[] | Query[]): Record<string, Param> {
  return entries.reduce((params, entry) => {
    return {
      ...params,
      ...entry.params,
    }
  }, {})
}

// {
//   name: 'lower-depth',
//   path: '/',
//   query: 'color=red',
//   component,
// }

// output, array of 1 flattened (similar to current resolved) routes

// createParentRoute({
//   name: 'higher-depth',
//   path: '/',
//   children: [
//     {
//       name: 'higher-depth-child',
//       path: '',
//       query: 'color=red',
//       component,
//     },
//   ],
// })

const [stringPath] = createNewRouterRoute({
  name: 'lower-depth',
  path: path('/', {}),
  query: query('color=:red', { red: Boolean }),
  component,
})

const objPath = createNewRouterRoutes([
  {
    name: 'lower-depth',
    path: path('/', {}),
    query: query('color=:red', { red: Boolean }),
    component,
  },
  {
    name: 'higher-depth',
    path: createPath('/parent', {}),
    query: createQuery('color=red', {}),
    component,
    children: createNewRouterRoute(
      {
        name: 'higher-depth-child',
        path: '/child',
        query: 'food=potato',
        component,
      },
    ),
  },
])


// output, array of 2 flattened (similar to current resolved) routes
// every path is Path, children merged with parents

// [
//   {name: 'higher-depth'},
//   {name: 'higher-depth-child'},
// ]


// todo:

// - check plural version createRouterRoutes
// - fix order of combine Path (probably Query)