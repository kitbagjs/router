import { Component, DeepReadonly } from 'vue'
import { AfterRouteHook, BeforeRouteHook } from '@/types/hooks'
import { Path } from '@/types/path'
import { Query } from '@/types/query'
import { Routes } from '@/types/route'
import { MaybeArray } from '@/types/utilities'

/**
 * Represents additional metadata associated with a route, customizable via declaration merging.
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

type WithComponent = {
  /**
   * A Vue component, which can be either synchronous or asynchronous components.
   */
  component: Component,
}

type WithComponents = {
  /**
   * Multiple components for named views, which can be either synchronous or asynchronous components.
   */
  components: Record<string, Component>,
}

/**
 * Represents properties common to parent routes in a route configuration, including hooks, path, and optional query parameters.
 */
export type ParentRouteProps = Partial<WithComponent | WithComponents> & WithHooks & {
  /**
   * Name for route, used to create route keys and in navigation.
   */
  name?: string,
  /**
   * Path part of URL.
   */
  path: string | Path,
  /**
   * Query (aka search) part of URL.
   */
  query?: string | Query,
  /**
   * Disabled routes will not ever match but can still provide physical structure, nested children behave normally.
   */
  disabled?: boolean,
  /**
   * Children routes, expected type comes from `createRoutes()`
   */
  children: Routes,
  /**
   * Represents additional metadata associated with a route, customizable via declaration merging.
   */
  meta?: RouteMeta,
}

/**
 * Represents properties for child routes, including required component, name, and path.
 */
export type ChildRouteProps = (WithComponent | WithComponents) & WithHooks & {
  /**
   * Name for route, used to create route keys and in navigation.
   */
  name: string,
  /**
   * Children routes, expected type comes from `createRoutes()`
   */
  disabled?: boolean,
  /**
   * Path part of URL.
   */
  path: string | Path,
  /**
   * Query (aka search) part of URL.
   */
  query?: string | Query,
  /**
   * Represents additional metadata associated with a route, customizable via declaration merging.
   */
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

export function isParentRouteWithoutComponent(value: RouteProps): value is Omit<ParentRouteProps, 'component' | 'components'> {
  return isParentRoute(value) && !('component' in value) && !('components' in value)
}

export function isRouteWithComponent(value: RouteProps): value is RouteProps & WithComponent
export function isRouteWithComponent(value: Readonly<RouteProps>): value is Readonly<RouteProps & WithComponent>
export function isRouteWithComponent(value: DeepReadonly<RouteProps>): value is DeepReadonly<RouteProps & WithComponent>
export function isRouteWithComponent(value: unknown): boolean {
  return typeof value === 'object' && value !== null && 'component' in value
}

export function isRouteWithComponents(value: RouteProps): value is RouteProps & WithComponents
export function isRouteWithComponents(value: Readonly<RouteProps>): value is Readonly<RouteProps & WithComponents>
export function isRouteWithComponents(value: DeepReadonly<RouteProps>): value is DeepReadonly<RouteProps & WithComponents>
export function isRouteWithComponents(value: unknown): boolean {
  return typeof value === 'object' && value !== null && 'components' in value
}
