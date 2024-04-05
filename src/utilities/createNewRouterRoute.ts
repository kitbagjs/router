import { MergeParams, Param, Route } from '@/types'
import { Path, path as createPath, PathParams, path, ToPath } from '@/utilities/path'
import { Query, QueryParams, ToQuery, query as createQuery, query } from '@/utilities/query'
import { component } from '@/utilities/testHelpers'

// user land (input)
type FutureRoute = (Omit<Route, 'children'> & { children?: Readonly<NewRouterRoute[]> })

// internal version of FutureRoute (output)
type NewRouterRoute<
  TName extends string | undefined = any,
  TPath extends string | Path = any,
  TQuery extends string | Query | undefined = any
> = {
  matched: Route,
  matches: Route[],
  name: TName,
  path: ToPath<TPath>,
  query: ToQuery<TQuery>,
  pathParams: Record<string, Param>,
  queryParams: Record<string, Param>,
  depth: number,
}

type CombinePath<
  TParent extends string | Path,
  TChild extends string | Path
> = ToPath<TParent> extends { path: infer TParentPath extends string, params: infer TParentParams extends Record<string, unknown> }
  ? ToPath<TChild> extends { path: infer TChildPath extends string, params: infer TChildParams extends Record<string, unknown> }
    ? MergeParams<TParentParams, TChildParams> extends PathParams<`${TParentPath}${TChildPath}`>
      ? Path<`${TParentPath}${TChildPath}`, MergeParams<TParentParams, TChildParams>>
      : never
    : never
  : never

type CombineQuery<
  TParent extends string | Query | undefined,
  TChild extends string | Query | undefined
> = ToQuery<TParent> extends { query: infer TParentQuery extends string, params: infer TParentParams extends Record<string, unknown> }
  ? ToQuery<TChild> extends { query: infer TChildQuery extends string, params: infer TChildParams extends Record<string, unknown> }
    ? MergeParams<TParentParams, TChildParams> extends QueryParams<`${TParentQuery}${TChildQuery}`>
      ? Query<`${TParentQuery}${TChildQuery}`, MergeParams<TParentParams, TChildParams>>
      : never
    : never
  : never

type FlattenNewRouterRoute<TRoute extends FutureRoute, TChildren extends NewRouterRoute[] = TRoute['children'] extends NewRouterRoute[] ? TRoute['children'] : []> = [
  NewRouterRoute<TRoute['name'], TRoute['path'], TRoute['query']>,
  ...{ [K in keyof TChildren]: NewRouterRoute<
  TChildren[K]['name'],
  CombinePath<TRoute['path'], TChildren[K]['path']>,
  CombineQuery<TRoute['query'], TChildren[K]['query']>
  > }
]

type FlattenNewRouterRoutes<TRoutes extends Readonly<FutureRoute[]>> = FlatArray<{
  [K in keyof TRoutes]: FlattenNewRouterRoute<TRoutes[K]>
}, 1>

function createNewRouterRoutes<const TRoutes extends Readonly<FutureRoute[]>>(routes: TRoutes): FlattenNewRouterRoutes<TRoutes> {
  throw 'not implemented'
}

function createNewRouterRoute<const TRoute extends FutureRoute>(route: TRoute): FlattenNewRouterRoute<TRoute> {
  const path: Path = typeof route.path === 'string' ? createPath(route.path, {}) : route.path
  const query: Query = typeof route.query === 'string' ? createQuery(route.query, {}) : route.query ?? { query: '', params: {} }

  return [
    {
      matched: route,
      matches: [route],
      name: route.name,
      path,
      query,
      pathParams: extractParams([path]),
      queryParams: extractParams([query]),
      depth: 1,
    },
  ]
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

const stringPath = createNewRouterRoute({
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
// - what if name is omitted?