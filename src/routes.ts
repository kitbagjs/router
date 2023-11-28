import { Identity, IsAny } from './types/utilities'

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
    ? Param extends `?${infer OptionalParam}`
      ? MergeParams<AsTuple<{ [P in OptionalParam]?: ExtractParamType<OptionalParam, TParams> }>, ExtractParamsFromPathString<Rest, TParams>>
      : MergeParams<AsTuple<{ [P in Param]: ExtractParamType<Param, TParams> }>, ExtractParamsFromPathString<Rest, TParams>>
    : TPath extends `${string}:${infer Param}`
    ? Param extends `?${infer OptionalParam}`
      ? { [P in OptionalParam]?: ExtractParamType<OptionalParam, TParams> }
      : { [P in Param]: ExtractParamType<Param, TParams> }
    : {}

type AsTuple<T extends Record<string, any> | Record<string, any[]>> = {[K in keyof T]: T[K] extends any[] ? T[K] : [T[K]]}

type ExtractParamType<
  TParam extends string,
  TParams extends Record<string, Param>
> = TParam extends keyof TParams
  ? ReturnType<TParams[TParam]['get']>
  : string

type MergeParams<
  TParams extends Record<string, any[]>, 
  TInput extends Record<string, unknown>
> = {
  [K in keyof TParams | keyof TInput]: K extends keyof TParams & keyof TInput
    ? TParams[K] extends [...infer Params]
      ? [...Params, TInput[K]]
      : never
    : K extends keyof TParams
      ? TParams[K]
      : K extends keyof TInput
        ? [TInput[K]]
        : never
}

type RouteMethod<TParams extends Record<string, unknown>> = (params: TParams) => void

type MergePathParams<
    TAlpha extends Record<PropertyKey, unknown>, 
    TBeta extends Record<PropertyKey, unknown>
  > = {
    [K in keyof TAlpha | keyof TBeta]: K extends keyof TAlpha & keyof TBeta 
      ? (TAlpha[K] extends [...infer AlphaTuple]
        ? TBeta[K] extends [...infer BetaTuple]
          ? [...AlphaTuple, ...BetaTuple]
          : [...AlphaTuple, TBeta[K]]
        : TBeta[K] extends [...infer BetaTuple]
          ? [TAlpha[K], ...BetaTuple]
          : [TAlpha[K], TBeta[K]])
      : K extends keyof TAlpha 
        ? TAlpha[K] 
        : K extends keyof TBeta
          ? TBeta[K]
          : never
      }

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
        ? RouteMethods<Children, MergePathParams<TParams, ExtractParamsFromPath<Path>>>
        : never
      : TRoutes[number] extends { path: infer Path }
        ? RouteMethod<Identity<MergePathParams<TParams, ExtractParamsFromPath<Path>>>>
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