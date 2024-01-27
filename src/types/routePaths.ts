import { ExtractRouteMethodParams } from '@/types/routeMethods'
import { Public, Route, Routes } from '@/types/routes'

export type ExtractRoutePathParameters<
  TRouteMethods,
  TRoutePath extends string
> = TRoutePath extends string ? NestedObjectValue<TRouteMethods, TRoutePath> : never

type NestedObjectValue<
  TRouteMethods,
  TRoutePath extends string
> =
  TRoutePath extends `${infer F extends string & keyof TRouteMethods}.${infer R}`
    ? NestedObjectValue<TRouteMethods[F], R>
    : TRoutePath extends keyof TRouteMethods
      ? ExtractRouteMethodParams<TRouteMethods[TRoutePath]>
      : never

export type RoutePaths<
  TRoutes extends Routes,
  TPrefix extends string = ''
> = FlatArray<{
  [K in keyof TRoutes]: TRoutes[K] extends Route
    ? [RoutePath<TRoutes[K], TPrefix>, ChildrenPaths<TRoutes[K], TPrefix>]
    : never
}, 1>

type RoutePath<
  TRoute extends Route,
  TPrefix extends string
> = TRoute extends Public<TRoute> & { name: infer Name extends string }
  ? Prefix<TPrefix, Name>
  : never

type ChildrenPaths<
  TRoute extends Route,
  TPrefix extends string
> = TRoute extends { children: infer Children extends Routes }
  ? TRoute extends { name: infer Name extends string }
    ? RoutePaths<Children, Prefix<TPrefix, Name>>
    : never
  : never

type Prefix<
  TParentName extends string,
  TChildName extends string
> = `${TChildName}${TParentName}` extends ''
  ? ''
  : TParentName extends ''
    ? TChildName
    : TChildName extends ''
      ? TParentName
      : `${TParentName}.${TChildName}`