import { RouteMethod, RouteMethodResponse } from '@/types/routeMethod'
import { Public, Route, Routes } from '@/types/routes'
import { Identity, TupleCanBeAllUndefined, UnionToIntersection } from '@/types/utilities'
import { Path } from '@/utilities/path'
import { Query } from '@/utilities/query'

export type RouteMethods<
  TRoutes extends Routes = Routes,
  TPathParams extends Record<string, unknown[]> = Record<never, never>,
  TQueryParams extends Record<string, unknown[]> = Record<never, never>
> = UnionToIntersection<RouteMethodsTuple<TRoutes, TPathParams, TQueryParams>[number]>

type RouteMethodsTuple<
  TRoutes extends Routes,
  TPathParams extends Record<string, unknown[]>,
  TQueryParams extends Record<string, unknown[]>
> = {
  [K in keyof TRoutes]: TRoutes[K] extends { name: infer Name extends string }
    ? { [N in Name]: RouteMethodsOrMethod<TRoutes[K], TPathParams, TQueryParams> }
    : RouteMethodsOrMethod<TRoutes[K], TPathParams, TQueryParams>
}

type RouteMethodsOrMethod<
  TRoute extends Route,
  TPathParams extends Record<string, unknown[]>,
  TQueryParams extends Record<string, unknown[]>
> = TRoute extends { children: infer Children extends Routes }
  ? TRoute extends Public<TRoute>
    ? RouteMethods<Children, RoutePathParams<TRoute, TPathParams>, RouteQueryParams<TRoute, TQueryParams>> & CreateRouteMethod<TRoute, TPathParams, TQueryParams>
    : RouteMethods<Children, RoutePathParams<TRoute, TPathParams>, RouteQueryParams<TRoute, TQueryParams>>
  : TRoute extends Public<TRoute>
    ? CreateRouteMethod<TRoute, TPathParams, TQueryParams>
    : never

type CreateRouteMethod<
  TRoute extends Route,
  TPathParams extends Record<string, unknown[]>,
  TQueryParams extends Record<string, unknown[]>
> = RouteMethod<MarkOptionalParams<MergeParams<RoutePathParams<TRoute, TPathParams>, RouteQueryParams<TRoute, TQueryParams>>>>

export type ExtractRouteMethodParams<T> =
  T extends () => RouteMethodResponse
    ? never
    : T extends (params: infer Params) => RouteMethodResponse
      ? Params
      : never

export type RoutePathParams<
  TRoute extends Route,
  TPathParams extends Record<string, unknown[]>
> = TRoute extends { path: infer TPath extends string | Path }
  ? MergeParams<TPathParams, ExtractParamsFromPath<TPath>>
  : MergeParams<TPathParams, {}>

export type RouteQueryParams<
  TRoute extends Route,
  TQueryParams extends Record<string, unknown[]>
> = TRoute extends { query: infer TQuery extends string | Query }
  ? MergeParams<TQueryParams, ExtractParamsFromQuery<TQuery>>
  : MergeParams<TQueryParams, {}>

type ExtractParamsFromPath<
  TPath extends Route['path']
> = TPath extends Path
  ? TPath['params']
  : TPath extends string
    ? Path<TPath, object>['params']
    : never

type ExtractParamsFromQuery<
  TQuery extends Route['query']
> = TQuery extends Query
  ? TQuery['params']
  : TQuery extends string
    ? Query<TQuery, object>['params']
    : never

export type MergeParams<
  TAlpha extends Record<string, unknown>,
  TBeta extends Record<string, unknown>
> = {
  [K in keyof TAlpha | keyof TBeta]: K extends keyof TAlpha & keyof TBeta
    ? TAlpha[K] extends [...infer AlphaParams]
      ? TBeta[K] extends [...infer BetaParams]
        ? [...AlphaParams, ...BetaParams]
        : [...AlphaParams, TBeta[K]]
      : TBeta[K] extends [...infer BetaParams]
        ? [TAlpha[K], ...BetaParams]
        : [TAlpha[K], TBeta[K]]
    : K extends keyof TAlpha
      ? TAlpha[K] extends [...infer AlphaParams]
        ? [...AlphaParams]
        : [TAlpha[K]]
      : K extends keyof TBeta
        ? TBeta[K] extends [...infer BetaParams]
          ? [...BetaParams]
          : [TBeta[K]]
        : never
}

export type MarkOptionalParams<TParams extends Record<string, unknown[]>> = Identity<{
  [K in keyof GetAllOptionalParams<TParams>]?: K extends keyof TParams ? UnwrapSingleParams<TParams[K]> : never
} & {
  [K in keyof GetAllRequiredParams<TParams>]: K extends keyof TParams ? UnwrapSingleParams<TParams[K]> : never
}>

type UnwrapSingleParams<T extends unknown[]> = T extends [infer SingleParam] ? SingleParam : T

type GetAllOptionalParams<TParams extends Record<string, unknown[]>> = {
  [K in keyof TParams as TupleCanBeAllUndefined<TParams[K]> extends true ? K : never]: K
}

type GetAllRequiredParams<TParams extends Record<string, unknown[]>> = {
  [K in keyof TParams as TupleCanBeAllUndefined<TParams[K]> extends false ? K : never]: K
}
