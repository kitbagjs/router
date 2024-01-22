import { AsyncComponentLoader, Component, DefineComponent } from 'vue'
import { RouteMiddleware } from '@/types/middleware'
import { MaybeArray } from '@/types/utilities'
import { Path } from '@/utilities/path'
import { Query } from '@/utilities/query'

export type RouteComponent = Component | DefineComponent | AsyncComponentLoader

export interface RouteMeta {

}

export type ParentRoute<
  TPath extends string | Path = any,
  TQuery extends string | Query = any
> = {
  name?: string,
  path: TPath,
  query?: TQuery,
  public?: boolean,
  children: Routes,
  component?: RouteComponent,
  middleware?: MaybeArray<RouteMiddleware>,
  meta?: RouteMeta,
}

export type ChildRoute<
  TPath extends string | Path = any,
  TQuery extends string | Query = any
> = {
  name: string,
  public?: boolean,
  path: TPath,
  query?: TQuery,
  component: RouteComponent,
  middleware?: MaybeArray<RouteMiddleware>,
  meta?: RouteMeta,
}

export type Route<
  TPath extends string | Path = any,
  TQuery extends string | Query = any
> = ParentRoute<TPath, TQuery> | ChildRoute<TPath, TQuery>

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