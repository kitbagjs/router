import { Identity, IsAny, TupleCanBeAllUndefined } from './types/utilities'

export type Route<
  TRoute extends string | Path = any,
> = {
  name: string,
  path: TRoute 
  children?: Routes
}

export type RouteWithChildren = Route & {
  children: Routes
}

export type Routes = Readonly<Route[]>

type ExtractParamsFromPath<
  TPath extends Route['path'],
> = TPath extends Path
  ? ExtractParamsFromPathString<TPath['path'], TPath['params']>
  : TPath extends string
    ? ExtractParamsFromPathString<TPath, {}>
    : never

type ExtractParamsFromPathString<
  TPath extends string,
  TParams extends Record<string, Param> = {},
> = TPath extends `${infer Path}/`
  ? ExtractParamsFromPathString<Path, TParams>
  : TPath extends `${string}:${infer Param}/${infer Rest}`
    ? MergeParams<{ [P in ExtractParamName<Param>]: ExtractParam<Param, TParams>}, ExtractParamsFromPathString<Rest, TParams>>
    : TPath extends `${string}:${infer Param}`
      ? { [P in ExtractParamName<Param>]: ExtractParam<Param, TParams> }
      : {}

type ExtractParamName<
  TParam extends string
> = TParam extends `?${infer Param}` ? Param : TParam

type ExtractParam<
  TParam extends string,
  TParams extends Record<string, Param>
> = TParam extends `?${infer OptionalParam}`
  ? OptionalParam extends keyof TParams
    ? Param<ReturnType<TParams[OptionalParam]['get']> | undefined>
    : Param<string | undefined>
  : TParam extends keyof TParams
    ? Param<ReturnType<TParams[TParam]['get']>>
    : Param<string>

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

type ExtractParamsRecord<TParams extends Record<string, any[]>> = {
  [K in keyof TParams]: ExtractParamTuple<TParams[K]>
}

type ExtractParamTuple<TParams extends any[]> = {
  [K in keyof TParams]: ExtractParamType<TParams[K]>
}

type ExtractParamType<TParam> = TParam extends Param<infer Type> ? Type : never

type TransformParamsRecord<TParams extends Record<string, any[]>> = {
  [K in keyof GetAllOptionalParams<TParams>]?: K extends keyof TParams ? UnwrapSingleParams<TParams[K]> : never
} & {
  [K in keyof GetAllRequiredParams<TParams>]: K extends keyof TParams ? UnwrapSingleParams<TParams[K]> : never
}

type UnwrapSingleParams<T extends any[]> = T extends [infer SingleParam] ? SingleParam : T

type GetAllOptionalParams<TParams extends Record<string, any[]>> = {
  [K in keyof TParams as TupleCanBeAllUndefined<TParams[K]> extends true ? K : never]: K
}

type GetAllRequiredParams<TParams extends Record<string, any[]>> = {
  [K in keyof TParams as TupleCanBeAllUndefined<TParams[K]> extends false ? K : never]: K
}

type RouteMethod<TParams extends Record<string, unknown>> = (params: TParams) => void

export type ExtractRouteMethodParams<T> = T extends RouteMethod<infer Params>
  ? IsAny<Params> extends true
    ? Record<string, unknown>
    : Params
  : Record<string, unknown>

type RouteMethods<
  TRoutes extends Routes, 
  TParams extends Record<string, unknown>,
> = {
  [K in TRoutes[number]['name']]: TRoutes[number] extends { path: infer Path,  children: infer Children }
      ? Children extends Routes
        ? RouteMethods<Children, MergeParams<TParams, ExtractParamsFromPath<Path>>>
        : never
      : TRoutes[number] extends { path: infer Path }
        ? RouteMethod<Identity<TransformParamsRecord<ExtractParamsRecord<MergeParams<TParams, ExtractParamsFromPath<Path>>>>>>
        : never
}

type Path<
  T extends string = any,
  P extends PathParams<T> = any
> = {
  path: T,
  params: P
}

export type Param<T = any> = {
  get(value: string): T,
  set(value: T): string,
}

type PathParams<T extends string> = {
  [K in keyof ExtractParamsFromPathString<T>]?: Param
}

export function createRouter<T extends Routes>(_routes: T): { routes: RouteMethods<T, {}> } {
  throw 'not implemented'
}

export function path<T extends string, P extends PathParams<T>>(_path: T, _params: Identity<P>): Path<T, P> {
  throw 'not implemented'
}