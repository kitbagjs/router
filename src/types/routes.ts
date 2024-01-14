import { AsyncComponentLoader, Component, DefineComponent } from 'vue'
import { RouteMiddleware } from '@/types/middleware'
import { MaybeArray } from '@/types/utilities'
import { Path } from '@/utilities/path'

export type RouteComponent = Component | DefineComponent | AsyncComponentLoader

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

export type Public<T extends Route> = T & { public?: true | undefined }

export function isPublicRoute(value: Route): value is Public<Route> {
  return value.public !== false
}