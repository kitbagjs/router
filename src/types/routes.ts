import { Component, DefineComponent } from 'vue'
import { MaybeLazy } from '@/types/utilities'
import { Path } from '@/utilities/path'

type RouteComponent = MaybeLazy<Component | DefineComponent>

export type ParentRoute<
  TRoute extends string | Path = any
> = {
  name?: string,
  path: TRoute,
  public?: boolean,
  children: Routes,
  component?: RouteComponent,
}

export type ChildRoute<
  TRoute extends string | Path = any
> = {
  name: string,
  public?: boolean,
  path: TRoute,
  component: RouteComponent,
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