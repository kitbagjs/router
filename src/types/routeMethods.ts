import { ExtractParamType, Param } from '@/types/params'
import { RouteMethod, RouteMethodImplementation, RouteMethodResponse } from '@/types/routeMethod'
import { Disabled, Route, Routes } from '@/types/routes'
import { Identity, UnionToIntersection } from '@/types/utilities'
import { Path } from '@/utilities/path'
import { Query } from '@/utilities/query'

export type RouteMethods<
  TRoutes extends Routes = Routes,
  TPathParams extends Record<string, Param> = Record<never, never>,
  TQueryParams extends Record<string, Param> = Record<never, never>
> = UnionToIntersection<RouteMethodsTuple<TRoutes, TPathParams, TQueryParams>[number]>

export type RouteMethodsImplementation = {
  [key: string]: RouteMethodImplementation & Record<string, RouteMethodsImplementation>,
}

type RouteMethodsTuple<
  TRoutes extends Routes,
  TPathParams extends Record<string, Param>,
  TQueryParams extends Record<string, Param>
> = {
  [K in keyof TRoutes]: TRoutes[K] extends { name: infer Name extends string }
    ? { [N in Name]: RouteMethodsOrMethod<TRoutes[K], TPathParams, TQueryParams> }
    : RouteMethodsOrMethod<TRoutes[K], TPathParams, TQueryParams>
}

type RouteMethodsOrMethod<
  TRoute extends Route,
  TPathParams extends Record<string, Param>,
  TQueryParams extends Record<string, Param>
> = TRoute extends { children: infer Children extends Routes }
  ? TRoute extends Disabled<TRoute>
    ? RouteMethods<Children, RoutePathParams<TRoute, TPathParams>, RouteQueryParams<TRoute, TQueryParams>>
    : RouteMethods<Children, RoutePathParams<TRoute, TPathParams>, RouteQueryParams<TRoute, TQueryParams>> & CreateRouteMethod<TRoute, TPathParams, TQueryParams>
  : TRoute extends Disabled<TRoute>
    ? never
    : CreateRouteMethod<TRoute, TPathParams, TQueryParams>

type CreateRouteMethod<
  TRoute extends Route,
  TPathParams extends Record<string, Param>,
  TQueryParams extends Record<string, Param>
> = RouteMethod<MarkOptionalParams<MergeParams<RoutePathParams<TRoute, TPathParams>, RouteQueryParams<TRoute, TQueryParams>>>>

export type ExtractRouteMethodParams<T> =
  T extends () => RouteMethodResponse
    ? never
    : T extends (params: infer Params) => RouteMethodResponse
      ? Params
      : never

export type RoutePathParams<
  TRoute extends Route,
  TPathParams extends Record<string, Param>
> = TRoute extends { path: infer TPath extends string | Path }
  ? MergeParams<TPathParams, ExtractParamsFromPath<TPath>>
  : TPathParams

export type RouteQueryParams<
  TRoute extends Route,
  TQueryParams extends Record<string, Param>
> = TRoute extends { query: infer TQuery extends string | Query }
  ? MergeParams<TQueryParams, ExtractParamsFromQuery<TQuery>>
  : TQueryParams

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
    ? never
    : K extends keyof TAlpha
      ? TAlpha[K]
      : K extends keyof TBeta
        ? TBeta[K]
        : never
}

export type MarkOptionalParams<TParams extends Record<string, Param | undefined>> = Identity<{
  [K in keyof GetAllOptionalParams<TParams>]?: K extends keyof TParams ? ExtractParamType<TParams[K]> : never
} & {
  [K in keyof GetAllRequiredParams<TParams>]: K extends keyof TParams ? ExtractParamType<TParams[K]> : never
}>

type GetAllOptionalParams<TParams extends Record<string, unknown>> = {
  [K in keyof TParams as undefined extends TParams[K] ? K : never]: K
}

type GetAllRequiredParams<TParams extends Record<string, unknown>> = {
  [K in keyof TParams as undefined extends TParams[K] ? never : K]: K
}