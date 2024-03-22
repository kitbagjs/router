import { AsyncComponentLoader, Component, DefineComponent } from 'vue'
import { AfterRouteHook, BeforeRouteHook } from '@/types/hooks'
import { MaybeArray } from '@/types/utilities'
import { Path } from '@/utilities/path'
import { Query } from '@/utilities/query'

export type RouteComponent = Component | DefineComponent | AsyncComponentLoader

export interface RouteMeta {

}

type RouteWithHooks = {
  onBeforeRouteEnter?: MaybeArray<BeforeRouteHook>,
  onBeforeRouteUpdate?: MaybeArray<BeforeRouteHook>,
  onBeforeRouteLeave?: MaybeArray<BeforeRouteHook>,
  onAfterRouteEnter?: MaybeArray<AfterRouteHook>,
  onAfterRouteUpdate?: MaybeArray<AfterRouteHook>,
  onAfterRouteLeave?: MaybeArray<AfterRouteHook>,
}

export type ParentRoute = RouteWithHooks & {
  name?: string,
  path: string | Path,
  query?: string | Query,
  disabled?: boolean,
  children: Routes,
  component?: RouteComponent,
  meta?: RouteMeta,
}

export type ChildRoute = RouteWithHooks & {
  name: string,
  disabled?: boolean,
  path: string | Path,
  query?: string | Query,
  component: RouteComponent,
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