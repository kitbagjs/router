import { MarkOptionalParams, MergeParams, RoutePathParams, RouteQueryParams } from '@/types/routeMethods'
import { Public, Route, Routes } from '@/types/routes'
import { UnionToIntersection } from '@/types/utilities'

export type Flattened<
  TRoute extends Route,
  TPrefix extends string = '',
  TPathParams extends Record<string, unknown[]> = Record<never, never>,
  TQueryParams extends Record<string, unknown[]> = Record<never, never>
> = RouteFlat<TRoute, TPrefix, TPathParams, TQueryParams> & RouteChildrenFlat<TRoute, TPrefix, TPathParams, TQueryParams>

export type FlattenedRoutes<
  TRoute extends Routes,
  TPrefix extends string = '',
  TPathParams extends Record<string, unknown[]> = Record<never, never>,
  TQueryParams extends Record<string, unknown[]> = Record<never, never>
> = UnionToIntersection<{
  [K in keyof TRoute]: TRoute[K] extends Route
    ? Flattened<TRoute[K], TPrefix, TPathParams, TQueryParams>
    : Record<never, never>
}[number]>

type RouteFlat<
  TRoute extends Route,
  TPrefix extends string,
  TPathParams extends Record<string, unknown[]> = Record<never, never>,
  TQueryParams extends Record<string, unknown[]> = Record<never, never>
> = TRoute extends Public<TRoute> & { name: infer Name extends string }
  ? Record<Prefix<Name, TPrefix>, MarkOptionalParams<MergeParams<RoutePathParams<TRoute, TPathParams>, RouteQueryParams<TRoute, TQueryParams>>>>
  : Record<never, never>

type RouteChildrenFlat<
  TRoute extends Route,
  TPrefix extends string,
  TPathParams extends Record<string, unknown[]> = Record<never, never>,
  TQueryParams extends Record<string, unknown[]> = Record<never, never>
> = TRoute extends { children: infer Children extends Routes }
  ? TRoute extends Public<TRoute> & { name: infer Name extends string }
    ? FlattenedRoutes<Children, Prefix<Name, TPrefix>, RoutePathParams<TRoute, TPathParams>, RouteQueryParams<TRoute, TQueryParams>>
    : FlattenedRoutes<Children, TPrefix, RoutePathParams<TRoute, TPathParams>, RouteQueryParams<TRoute, TQueryParams>>
  : Record<never, never>

type Prefix<
  TChildName extends string,
  TParentName extends string
> = `${TChildName}${TParentName}` extends ''
  ? ''
  : TParentName extends ''
    ? TChildName
    : TChildName extends ''
      ? TParentName
      : `${TParentName}.${TChildName}`