import { ExtractRouteMethodParams, RouteComponent } from '.'
import { Public, Route } from '@/types/routes'

type NoInfer<T> = T & {}
type AnyRoute = { name: string, path: string, component: RouteComponent }
type AnyRoutes = Readonly<AnyRoute[]>

export type PushArgs<
  TRoutes extends AnyRoutes,
  TRouteMethods
> = {
  // (url: string): void,
  <TRouteKey extends RouteKeys<TRoutes>>(route: TRouteKey, params: ExtractRouteKeyParameters<TRouteMethods, NoInfer<TRouteKey>>): void,
}

export type ExtractRouteKeyParameters<
  TRoutes,
  TRouteKey
> = TRouteKey extends string ? NestedObjectValue<TRoutes, TRouteKey> : never

export type NestedObjectValue<
  T,
  K extends string
> =
  K extends `${infer F}.${infer R}`
    ? F extends keyof T
      ? NestedObjectValue<T[F], R>
      : never
    : K extends keyof T
      ? ExtractRouteMethodParams<T[K]>
      : never

export type RouteKeys<
  TRoutes extends AnyRoutes,
  TPrefix extends string = ''
> = FlatArray<{
  [K in keyof TRoutes]: TRoutes[K] extends Route
    ? [RouteKey<TRoutes[K], TPrefix>, ChildrenKeys<TRoutes[K], TPrefix>]
    : never
}, 1>

type RouteKey<
  TRoute extends AnyRoute,
  TPrefix extends string
> = TRoute extends Public<TRoute> & { name: infer Name extends string }
  ? Prefix<TPrefix, Name>
  : never

type ChildrenKeys<
  TRoute extends Route,
  TPrefix extends string
> = TRoute extends { children: infer Children extends AnyRoutes }
  ? TRoute extends { name: infer Name extends string }
    ? RouteKeys<Children, Prefix<TPrefix, Name>>
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