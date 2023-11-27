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

type ExtractPathParams<
  TPath extends Route['path'],
  TParams extends Record<string, Param> = {}
> = TPath extends Path
  ? ExtractPathStringParams<TPath['path'], TPath['params']>
  : TPath extends string
    ? ExtractPathStringParams<TPath, TParams>
    : never

type ExtractPathStringParams<
  TPath extends string,
  TParams extends Record<string, Param> = {}
> = TPath extends `${infer Path}/`
  ? ExtractPathStringParams<Path, TParams>
  : TPath extends `${infer _Start}:${infer Param}/${infer Rest}`
    ? Param extends `?${infer OptionalParam}`
      ? MergePathParams<{ [P in OptionalParam]?: ExtractParamType<Param, TParams> }, ExtractPathStringParams<Rest, TParams>>
      : MergePathParams<{ [P in Param]: ExtractParamType<Param, TParams> }, ExtractPathStringParams<Rest, TParams>>
    : TPath extends `${infer _Start}:${infer Param}`
    ? Param extends `?${infer OptionalParam}`
      ? { [P in OptionalParam]?: ExtractParamType<Param, TParams> }
      : { [P in Param]: ExtractParamType<Param, TParams> }
    : {}

type ExtractParamType<
  TParam extends string,
  TParams extends Record<string, Param>
> = TParam extends keyof TParams
  ? ReturnType<TParams[TParam]['get']>
  : string
  
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
  [K in TRoutes[number]['name']]: TRoutes[number] extends { path: infer P,  children: infer C }
      ? C extends Routes
        ? RouteMethods<C, TParams & ExtractPathParams<P>>
        : never
      : TRoutes[number] extends { path: infer P }
        ? RouteMethod<Identity<MergePathParams<TParams, ExtractPathParams<P>>>>
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
  [K in keyof ExtractPathStringParams<T>]?: Param
}

export function createRouter<T extends Routes>(_routes: T): RouteMethods<T, {}> {
  throw 'not implemented'
}

export function path<T extends string, P extends PathParams<T>>(_path: T, _params: Identity<P>): Path<T, P> {
  throw 'not implemented'
}