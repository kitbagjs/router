import { Component } from 'vue'
import { combineKey } from '@/services/combineKey'
import { combinePath } from '@/services/combinePath'
import { combineQuery } from '@/services/combineQuery'
import { ComponentProps } from '@/services/component'
import { AfterRouteHook, BeforeRouteHook } from '@/types/hooks'
import { Host } from '@/types/host'
import { Path } from '@/types/path'
import { Query } from '@/types/query'
import { RouteMeta } from '@/types/register'
import { Route } from '@/types/route'
import { MaybeArray, MaybePromise } from '@/types/utilities'

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
  TComponent extends Component = Component,
  TParams extends Record<string, unknown> = Record<string, unknown>
> = {
  /**
   * A Vue component, which can be either synchronous or asynchronous components.
   */
  component: TComponent,
  props?: (params: TParams) => TComponent extends Component ? ComponentProps<TComponent> : {},
}

export function isWithComponent(options: CreateRouteOptions): options is CreateRouteOptions & WithComponent {
  return 'component' in options && Boolean(options.component)
}

export type WithComponents<
  TComponents extends Record<string, Component> = Record<string, Component>,
  TParams extends Record<string, unknown> = Record<string, unknown>
> = {
  /**
   * Multiple components for named views, which can be either synchronous or asynchronous components.
   */
  components: TComponents,
  props?: {
    [TKey in keyof TComponents]?: (params: TParams) => TComponents[TKey] extends Component ? MaybePromise<ComponentProps<TComponents[TKey]>> : {}
  },
}

export function isWithComponents(options: CreateRouteOptions): options is CreateRouteOptions & WithComponents {
  return 'components' in options && Boolean(options.components)
}

export type CreateRouteOptions<
  TName extends string | undefined = string | undefined,
  TPath extends string | Path | undefined = string | Path | undefined,
  TQuery extends string | Query | undefined = string | Query | undefined
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
  meta?: RouteMeta,
}

export function combineRoutes(parent: Route, child: Route): Route {
  return {
    ...child,
    key: combineKey(parent.key, child.key),
    path: combinePath(parent.path, child.path),
    query: combineQuery(parent.query, child.query),
    matches: [...parent.matches, child.matched],
    host: parent.host,
    depth: parent.depth + 1,
  }
}