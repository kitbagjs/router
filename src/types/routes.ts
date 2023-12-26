import { Component, DefineComponent } from 'vue'
import { RouteMiddleware } from '@/types/middleware'
import { MaybeArray, MaybeLazy } from '@/types/utilities'
import { Path } from '@/utilities/path'

type RouteComponent = MaybeLazy<Component | DefineComponent>

export interface RouteMeta {

}

export type ParentRoute<
  TRoute extends string | Path = any
> = {
  name?: string,
  path: TRoute,
  public?: boolean,
  children: Routes,
  component?: RouteComponent,
  middleware?: MaybeArray<RouteMiddleware>,
  meta?: RouteMeta,
}

export type ChildRoute<
  TRoute extends string | Path = any
> = {
  name: string,
  public?: boolean,
  path: TRoute,
  component: RouteComponent,
  middleware?: MaybeArray<RouteMiddleware>,
  meta?: RouteMeta,
}

export type Route<
  TRoute extends string | Path = any
> = ParentRoute<TRoute> | ChildRoute<TRoute>

export type Routes = Readonly<Route[]>

export function isParentRoute(value: Route): value is ParentRoute {
  return 'children' in value
}

export function isNamedRoute(value: Route): value is Route & { name: string } {
  return 'name' in value && !!value.name
}

export function isPublicRoute(value: Route): value is Route & { public: true } {
  return value.public !== false
}

export type IsPublicRoute<TRoute extends Route> = 'public' extends keyof TRoute
  ? TRoute extends { public: false }
    ? false
    : true
  : true