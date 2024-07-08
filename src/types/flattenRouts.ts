import { CombineName } from '@/services/combineName'
import { CombinePath } from '@/services/combinePath'
import { CombineQuery } from '@/services/combineQuery'
import { ExternalRouteProps } from '@/types/externalRouteProps'
import { Path, ToPath } from '@/types/path'
import { Query, ToQuery } from '@/types/query'
import { Route } from '@/types/route'
import { ParentRouteProps, RouteProps } from '@/types/routeProps'

export type FlattenRoutes<TRoutes extends Readonly<RouteProps[] | ExternalRouteProps[]>> = Flatten<[...{
  [K in keyof TRoutes]: FlattenRoute<TRoutes[K]>
}]>

type FlattenRoute<
  TRoute extends RouteProps | ExternalRouteProps,
  TKey extends string = string & TRoute['name'],
  THost extends string = TRoute extends { host: infer T extends string } ? T : '',
  TPath extends Path = ToPath<TRoute['path']>,
  TQuery extends Query = ToQuery<TRoute['query']>,
  TDisabled extends boolean = TRoute['disabled'] extends boolean ? TRoute['disabled'] : false,
  TChildren extends Route[] = ExtractRouteChildren<TRoute>> =
  [
    Route<TKey, THost, TPath, TQuery, TDisabled>,
    ...{
      [K in keyof TChildren]: Route<
      CombineName<TKey, TChildren[K]['key']>,
      THost,
      CombinePath<TPath, TChildren[K]['path']>,
      CombineQuery<TQuery, TChildren[K]['query']>,
      TChildren[K]['disabled']
      >
    }
  ]

type ExtractRouteChildren<TRoute extends RouteProps | ExternalRouteProps> = TRoute extends ParentRouteProps
  ? TRoute['children'] extends Route[]
    ? TRoute['children']
    : []
  : []

type Flatten<T extends any[]> = T extends [infer First, ...infer Rest]
  ? First extends unknown[]
    ? Flatten<[...First, ...Flatten<Rest>]>
    : [First, ...Flatten<Rest>]
  : []