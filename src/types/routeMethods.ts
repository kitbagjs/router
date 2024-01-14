import { Param, ParamGetSet, ParamGetter } from '@/types/params'
import { RouteMethod, RouteMethodResponse } from '@/types/routeMethod'
import { Public, Route, Routes } from '@/types/routes'
import { Identity, ReplaceAll, TupleCanBeAllUndefined, UnionToIntersection } from '@/types/utilities'
import { Path } from '@/utilities/path'

export type RouteMethods<
  TRoutes extends Routes,
  TParams extends Record<string, unknown> = Record<never, never>
> = Identity<UnionToIntersection<RouteMethodsTuple<TRoutes, TParams>[number]>>

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
    ? TRoute extends Public<TRoute>
      ? RouteMethods<Children, MergeParams<TParams, ExtractParamsFromPath<Path>>> & CreateRouteMethod<TParams, Path>
      : RouteMethods<Children, MergeParams<TParams, ExtractParamsFromPath<Path>>>
    : never
  : TRoute extends { path: infer Path }
    ? TRoute extends Public<TRoute>
      ? CreateRouteMethod<TParams, Path>
      : never
    : never

type CreateRouteMethod<
  TParams extends Record<string, unknown>,
  TPath extends Route['path']
> = RouteMethod<MarkOptionalParams<MergeParams<TParams, ExtractParamsFromPath<TPath>>>>

export type ExtractRouteMethodParams<T extends RouteMethod> =
  T extends () => RouteMethodResponse
    ? never
    : T extends (params: infer Params) => RouteMethodResponse
      ? Params
      : never

export type ExtractParamsFromPath<
  TPath extends Route['path']
> = TPath extends Path
  ? TPath['params']
  : TPath extends string
    ? Path<TPath, object>['params']
    : never

type ParamEnd = '/'

type UnifyParamEnds<
  TPath extends string
> = ReplaceAll<ReplaceAll<TPath, '-', ParamEnd>, '_', ParamEnd>

export type ExtractParamsFromPathString<
  TPath extends string,
  TParams extends Record<string, Param | undefined> = Record<never, never>
> = UnifyParamEnds<TPath> extends `${infer Path}${ParamEnd}`
  ? ExtractParamsFromPathString<Path, TParams>
  : UnifyParamEnds<TPath> extends `${string}:${infer Param}${ParamEnd}${infer Rest}`
    ? MergeParams<{ [P in ExtractParamName<Param>]: ExtractPathParamType<Param, TParams> }, ExtractParamsFromPathString<Rest, TParams>>
    : UnifyParamEnds<TPath> extends `${string}:${infer Param}`
      ? { [P in ExtractParamName<Param>]: [ExtractPathParamType<Param, TParams>] }
      : Record<never, never>

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

type ExtractParamName<
  TParam extends string
> = TParam extends `?${infer Param}`
  ? Param extends ''
    ? never
    : Param
  : TParam extends ''
    ? never
    : TParam

type ExtractPathParamType<
  TParam extends string,
  TParams extends Record<string, Param | undefined>
> = TParam extends `?${infer OptionalParam}`
  ? OptionalParam extends keyof TParams
    ? ExtractParamType<TParams[OptionalParam]> | undefined
    : string | undefined
  : TParam extends keyof TParams
    ? ExtractParamType<TParams[TParam]>
    : string

export type ExtractParamType<TParam extends Param | undefined> = TParam extends ParamGetSet<infer Type>
  ? Type
  : TParam extends ParamGetter
    ? ReturnType<TParam>
    : string

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
