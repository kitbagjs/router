import { AsyncComponentLoader, Component, DefineComponent } from 'vue'
import { RouteMiddleware } from '@/types/middleware'
import { MaybeArray } from '@/types/utilities'
import { Path } from '@/utilities/path'
import { Query } from '@/utilities/query'

export type RouteComponent = Component | DefineComponent | AsyncComponentLoader

export interface RouteMeta {

}

export type ParentRoute = {
  name?: string,
  path: string | Path,
  query?: string | Query,
  disabled?: boolean,
  children: Routes,
  component?: RouteComponent,
  onBeforeRouteEnter?: MaybeArray<RouteMiddleware>,
  onBeforeRouteUpdate?: MaybeArray<RouteMiddleware>,
  onBeforeRouteLeave?: MaybeArray<RouteMiddleware>,
  meta?: RouteMeta,
}

export type ChildRoute = {
  name: string,
  disabled?: boolean,
  path: string | Path,
  query?: string | Query,
  component: RouteComponent,
  onBeforeRouteEnter?: MaybeArray<RouteMiddleware>,
  onBeforeRouteUpdate?: MaybeArray<RouteMiddleware>,
  onBeforeRouteLeave?: MaybeArray<RouteMiddleware>,
  meta?: RouteMeta,
}

export type Route = Readonly<ParentRoute | ChildRoute>
export type Routes = Readonly<Route[]>

export function isParentRoute(value: Route): value is ParentRoute {
  return 'children' in value
}

export function isNamedRoute(value: Route): value is Route & { name: string } {
  return 'name' in value && !!value.name
}

export type Disabled<T extends Route> = T & { disabled: true }

export function isDisabledRoute(value: Route): value is Disabled<Route> {
  return !!value.disabled
}