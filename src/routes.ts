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

// Converts a template literal like `/account/:accountId/workspace/:workspaceId/:?foo` into
// { accountId: TValue, workspaceId: TValue, foo?: TValue }
type ExtractPathParams<
  TPath extends string,
  TValue = string
> = TPath extends `${infer Path}/`
  ? ExtractPathParams<Path>
  : TPath extends `${infer _Start}:${infer Param}/${infer Rest}`
    ? Param extends `?${infer OptionalParam}`
      ? { [P in OptionalParam]?: TValue } & ExtractPathParams<Rest>
      : { [P in Param]: TValue } & ExtractPathParams<Rest>
    : TPath extends `${infer _Start}:${infer Param}`
    ? Param extends `?${infer OptionalParam}`
      ? { [P in OptionalParam]?: TValue }
      : { [P in Param]: TValue }
    : never

export type RouteMethod<TParams extends Record<string, unknown>> = (params: TParams) => void

export type ExtractRouteMethodParams<T> = T extends RouteMethod<infer Params>
  ? IsAny<Params> extends true
    ? Record<string, unknown>
    : Params
  : Record<string, unknown>

type RouteMethods<
  TRoutes extends Routes, 
  TParams extends Record<string, unknown>,
> = {
  [K in TRoutes[number]['name']]: TRoutes[number] extends { children: infer C }
      ? C extends Routes
          ? RouteMethods<C, TParams & RoutePathParams<TRoutes[number]['path']>>
          : never
      : RouteMethod<Identity<TParams & RoutePathParams<TRoutes[number]['path']>>>
}

type ExtractTypedPathParams<TPath extends Path> = {
  [P in keyof ExtractPathParams<TPath['path']>]: P extends keyof TPath['params'] ? ReturnType<TPath['params'][P]['get']> : string
}

type RoutePathParams<TPath extends Route['path']> = TPath extends string
  ? ExtractPathParams<TPath>
  : TPath extends Path
    ? ExtractTypedPathParams<TPath>
    : never

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

type PathParams<T extends string> = Partial<Identity<ExtractPathParams<T, Param>>>

export function createRouter<T extends Routes>(_routes: T): RouteMethods<T, {}> {
  throw 'not implemented'
}

export function path<T extends string, P extends PathParams<T>>(_path: T, _params: P): Path<T, P> {
  throw 'not implemented'
}