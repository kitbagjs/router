import { Component } from 'vue'
import { combineKey } from '@/services/combineKey'
import { combinePath } from '@/services/combinePath'
import { combineQuery } from '@/services/combineQuery'
import { combineState } from '@/services/combineState'
import { AfterRouteHook, BeforeRouteHook } from '@/types/hooks'
import { Host } from '@/types/host'
import { Param } from '@/types/paramTypes'
import { Path } from '@/types/path'
import { Query } from '@/types/query'
import { RouteMeta } from '@/types/register'
import { Route } from '@/types/route'
import { MaybeArray } from '@/types/utilities'

/**
 * Defines route hooks that can be applied before entering, updating, or leaving a route, as well as after these events.
 */
export type WithHooks = {
  onBeforeRouteEnter?: MaybeArray<BeforeRouteHook>,
  onBeforeRouteUpdate?: MaybeArray<BeforeRouteHook>,
  onBeforeRouteLeave?: MaybeArray<BeforeRouteHook>,
  onAfterRouteEnter?: MaybeArray<AfterRouteHook>,
  onAfterRouteUpdate?: MaybeArray<AfterRouteHook>,
  onAfterRouteLeave?: MaybeArray<AfterRouteHook>,
}

export type WithHost<THost extends string | Host = string | Host> = {
  /**
   * Host part of URL.
   */
  host: THost,
}

export function isWithHost(options: CreateRouteOptions): options is CreateRouteOptions & WithHost {
  return 'host' in options && Boolean(options.host)
}

export type WithoutHost = {
  host?: never,
}

export type WithParent<TParent extends Route = Route> = {
  parent: TParent,
}

export function isWithParent<T extends Record<string, unknown>>(options: T): options is T & WithParent {
  return 'parent' in options && Boolean(options.parent)
}

export type WithoutParent = {
  parent?: never,
}

export type WithComponent<
  TComponent extends Component | undefined = Component | undefined
> = {
  /**
   * A Vue component, which can be either synchronous or asynchronous components.
   */
  component?: TComponent,
}

export function isWithComponent(options: CreateRouteOptions): options is CreateRouteOptions & { component: Component } {
  return 'component' in options && Boolean(options.component)
}

export type WithComponents<
  TComponents extends Record<string, Component> | undefined = Record<string, Component> | undefined
> = {
  /**
   * Multiple components for named views, which can be either synchronous or asynchronous components.
   */
  components?: TComponents,
}

export function isWithComponents(options: CreateRouteOptions): options is CreateRouteOptions & { components: Record<string, Component> } {
  return 'components' in options && Boolean(options.components)
}

export type WithState<TState extends Record<string, Param> = Record<string, Param>> = {
  /**
   * Type params for additional data intended to be stored in history state, all keys will be optional unless a default is provided.
   */
  state: TState,
}

export function isWithState(options: CreateRouteOptions): options is CreateRouteOptions & WithState {
  return 'state' in options && Boolean(options.state)
}

export type WithoutState = {
  state?: never,
}

export type CreateRouteOptions<
  TName extends string | undefined = string | undefined,
  TPath extends string | Path | undefined = string | Path | undefined,
  TQuery extends string | Query | undefined = string | Query | undefined,
  TMeta extends RouteMeta = RouteMeta
> = {
  /**
   * Name for route, used to create route keys and in navigation.
   */
  name?: TName,
  /**
   * Path part of URL.
   */
  path?: TPath,
  /**
   * Query (aka search) part of URL.
   */
  query?: TQuery,
  /**
   * Represents additional metadata associated with a route, customizable via declaration merging.
   */
  meta?: TMeta,
}

export function combineRoutes(parent: Route, child: Route): Route {
  return {
    ...child,
    key: combineKey(parent.key, child.key),
    path: combinePath(parent.path, child.path),
    query: combineQuery(parent.query, child.query),
    stateParams: combineState(parent.stateParams, child.stateParams),
    matches: [...parent.matches, child.matched],
    host: parent.host,
    depth: parent.depth + 1,
  }
}