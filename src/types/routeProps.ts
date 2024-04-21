import { AsyncComponentLoader, Component, DefineComponent } from 'vue'
import { AfterRouteHook, BeforeRouteHook } from '@/types/hooks'
import { Routes } from '@/types/route'
import { MaybeArray } from '@/types/utilities'
import { Path } from '@/utilities/path'
import { Query } from '@/utilities/query'

export type RouteComponent = Component | DefineComponent | AsyncComponentLoader

export interface RouteMeta {

}

type WithHooks = {
  onBeforeRouteEnter?: MaybeArray<BeforeRouteHook>,
  onBeforeRouteUpdate?: MaybeArray<BeforeRouteHook>,
  onBeforeRouteLeave?: MaybeArray<BeforeRouteHook>,
  onAfterRouteEnter?: MaybeArray<AfterRouteHook>,
  onAfterRouteUpdate?: MaybeArray<AfterRouteHook>,
  onAfterRouteLeave?: MaybeArray<AfterRouteHook>,
}

export type ParentRouteProps = WithHooks & {
  name?: string,
  path: string | Path,
  query?: string | Query,
  disabled?: boolean,
  children: Routes,
  component?: RouteComponent,
  meta?: RouteMeta,
}

export type ChildRouteProps = WithHooks & {
  name: string,
  disabled?: boolean,
  path: string | Path,
  query?: string | Query,
  component: RouteComponent,
  meta?: RouteMeta,
}

export type RouteProps = Readonly<ParentRouteProps | ChildRouteProps>

export function isParentRoute(value: RouteProps): value is ParentRouteProps {
  return 'children' in value
}