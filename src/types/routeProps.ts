import { Component } from 'vue'
import { AfterRouteHook, BeforeRouteHook } from '@/types/hooks'
import { Path } from '@/types/path'
import { Query } from '@/types/query'
import { Routes } from '@/types/route'
import { MaybeArray } from '@/types/utilities'

/**
 * Represents additional metadata associated with a route, customizable via extensions.
 * @example
 * ```ts
 * declare module '@kitbag/router' {
 *   interface RouteMeta {
 *     pageTitle?: string
 *   }
 * }
 * ```
 */
export interface RouteMeta extends Record<string, unknown> {}

/**
 * Defines route hooks that can be applied before entering, updating, or leaving a route, as well as after these events.
 */
type WithHooks = {
  onBeforeRouteEnter?: MaybeArray<BeforeRouteHook>,
  onBeforeRouteUpdate?: MaybeArray<BeforeRouteHook>,
  onBeforeRouteLeave?: MaybeArray<BeforeRouteHook>,
  onAfterRouteEnter?: MaybeArray<AfterRouteHook>,
  onAfterRouteUpdate?: MaybeArray<AfterRouteHook>,
  onAfterRouteLeave?: MaybeArray<AfterRouteHook>,
}

/**
 * Represents properties common to parent routes in a route configuration, including hooks, path, and optional query parameters.
 */
export type ParentRouteProps = WithHooks & {
  name?: string,
  path: string | Path,
  query?: string | Query,
  disabled?: boolean,
  children: Routes,
  component?: Component,
  meta?: RouteMeta,
}

/**
 * Represents properties for child routes, including required component, name, and path.
 */
export type ChildRouteProps = WithHooks & {
  name: string,
  disabled?: boolean,
  path: string | Path,
  query?: string | Query,
  component: Component,
  meta?: RouteMeta,
}

/**
 * Unifies the properties of both parent and child routes, ensuring type safety and consistency across route configurations.
 */
export type RouteProps = Readonly<ParentRouteProps | ChildRouteProps>

/**
 * Type guard function to determine if a given route configuration is a parent route, based on the presence of children.
 * @param value - The route configuration to check.
 * @returns True if the route configuration has children, indicating it is a parent route.
 */
export function isParentRoute(value: RouteProps): value is ParentRouteProps {
  return 'children' in value
}
