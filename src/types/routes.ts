import { Component, DefineComponent } from 'vue'
import { MaybeLazy } from '@/types/utilities'
import { Path } from '@/utilities/path'

type RouteComponent = MaybeLazy<Component | DefineComponent>

export interface RouteMeta {

}

type BaseRoute = {
  meta?: RouteMeta,
  public?: boolean,
  path: string | Path,
}

export type ParentRoute = BaseRoute & {
  name?: string,
  children: Routes,
  component?: RouteComponent,
}

export type ChildRoute = BaseRoute & {
  name: string,
  component: RouteComponent,
}

export type Route = ParentRoute | ChildRoute

export type Routes = Readonly<Route[]>

export function isParentRoute(value: Route): value is ParentRoute {
  return 'children' in value
}

export function isNamedRoute(value: Route): value is Route & { name: string } {
  return 'name' in value && !!value.name
}