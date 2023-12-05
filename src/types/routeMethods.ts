import { Param, ParamGetter } from '@/types/params'
import { Route, Routes } from '@/types/routes'
import { Identity, IsAny, IsEmptyObject, TupleCanBeAllUndefined, UnionToIntersection } from '@/types/utilities'
import { Path } from '@/utilities/path'

export type RouteMethod<
  TParams extends Record<string, unknown> = any
> = IsEmptyObject<TParams> extends false
  ? (params: TParams) => void
  : () => void

export type RouteMethods<
  TRoutes extends Routes,
  TParams extends Record<string, unknown>
> = UnionToIntersection<RouteMethodsTuple<TRoutes, TParams>[number]>

type RouteMethodsTuple<
  TRoutes extends Routes,
  TParams extends Record<string, unknown>
> = {
  [K in keyof TRoutes]: TRoutes[K] extends { name: infer Name extends string }
    ? { [N in Name]: RouteMethodsOrMethod<TRoutes[K], TParams> }
    : RouteMethodsOrMethod<TRoutes[K], TParams>
}

type RouteMethodsOrMethod<
  TRoute extends Route,
  TParams extends Record<string, unknown>
> = TRoute extends { path: infer Path, children: infer Children }
  ? Children extends Routes
    ? IsPublicRoute<TRoute> extends true
      ? RouteMethods<Children, MergeParams<TParams, ExtractParamsFromPath<Path>>> & CreateRouteMethod<TParams, Path>
      : RouteMethods<Children, MergeParams<TParams, ExtractParamsFromPath<Path>>>
    : never
  : TRoute extends { path: infer Path }
    ? IsPublicRoute<TRoute> extends true
      ? CreateRouteMethod<TParams, Path>
      : never
    : never

type IsPublicRoute<TRoute extends Route> = 'public' extends keyof TRoute
  ? TRoute extends { public: false }
    ? false
    : true
  : true

type CreateRouteMethod<
  TParams extends Record<string, unknown>,
  TPath extends Route['path']
> = RouteMethod<Identity<TransformParamsRecord<ExtractParamsRecord<MergeParams<TParams, ExtractParamsFromPath<TPath>>>>>>

export type ExtractRouteMethodParams<T> = T extends RouteMethod<infer Params>
  ? IsAny<Params> extends true
    ? Record<string, unknown>
    : Params
  : Record<string, unknown>

export type ExtractParamsFromPath<
  TPath extends Route['path']
> = TPath extends Path
  ? ExtractParamsFromPathString<TPath['path'], TPath['params']>
  : TPath extends string
    ? ExtractParamsFromPathString<TPath>
    : never

export type ExtractParamsFromPathString<
  TPath extends string,
  TParams extends Record<string, Param> = Record<never, never>
> = TPath extends `${infer Path}/`
  ? ExtractParamsFromPathString<Path, TParams>
  : TPath extends `${string}:${infer Param}/${infer Rest}`
    ? MergeParams<{ [P in ExtractParamName<Param>]: ExtractParam<Param, TParams> }, ExtractParamsFromPathString<Rest, TParams>>
    : TPath extends `${string}:${infer Param}`
      ? { [P in ExtractParamName<Param>]: ExtractParam<Param, TParams> }
      : Record<never, never>

type MergeParams<
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

type ExtractParamName<
  TParam extends string
> = TParam extends `?${infer Param}`
  ? Param extends ''
    ? never
    : Param
  : TParam extends ''
    ? never
    : TParam

type ExtractParam<
  TParam extends string,
  TParams extends Record<string, Param>
> = TParam extends `?${infer OptionalParam}`
  ? OptionalParam extends keyof TParams
    ? Param<ExtractParamType<TParams[OptionalParam]> | undefined>
    : Param<string | undefined>
  : TParam extends keyof TParams
    ? Param<ExtractParamType<TParams[TParam]>>
    : Param<string>

type ExtractParamType<TParam> = TParam extends Param<infer Type>
  ? Type
  : TParam extends ParamGetter
    ? ReturnType<TParam>
    : never

type TransformParamsRecord<TParams extends Record<string, unknown[]>> = {
  [K in keyof GetAllOptionalParams<TParams>]?: K extends keyof TParams ? UnwrapSingleParams<TParams[K]> : never
} & {
  [K in keyof GetAllRequiredParams<TParams>]: K extends keyof TParams ? UnwrapSingleParams<TParams[K]> : never
}

type ExtractParamsRecord<TParams extends Record<string, unknown[]>> = {
  [K in keyof TParams]: ExtractParamTuple<TParams[K]>
}

type ExtractParamTuple<TParams extends unknown[]> = {
  [K in keyof TParams]: ExtractParamType<TParams[K]>
}

type UnwrapSingleParams<T extends unknown[]> = T extends [infer SingleParam] ? SingleParam : T

type GetAllOptionalParams<TParams extends Record<string, unknown[]>> = {
  [K in keyof TParams as TupleCanBeAllUndefined<TParams[K]> extends true ? K : never]: K
}

type GetAllRequiredParams<TParams extends Record<string, unknown[]>> = {
  [K in keyof TParams as TupleCanBeAllUndefined<TParams[K]> extends false ? K : never]: K
}
