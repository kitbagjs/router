import { Component } from 'vue'
import { combineKey } from '@/services/combineKey'
import { combinePath } from '@/services/combinePath'
import { combineQuery } from '@/services/combineQuery'
import { AfterRouteHook, BeforeRouteHook } from '@/types/hooks'
import { Host } from '@/types/host'
import { Path } from '@/types/path'
import { Query } from '@/types/query'
import { RouteMeta } from '@/types/register'
import { Route } from '@/types/route'
import { MaybeArray } from '@/types/utilities'

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

type WithSingleComponent = {
  /**
   * A Vue component, which can be either synchronous or asynchronous components.
   */
  component: Component,
}

type WithComponentRecord = {
  /**
   * Multiple components for named views, which can be either synchronous or asynchronous components.
   */
  components: Record<string, Component>,
}

type WithComponent = Partial<WithSingleComponent | WithComponentRecord>

export function isRouteWithParent(options: CreateRouteOptions): options is CreateRouteOptionsWithParent<Route> {
  return 'parent' in options
}

export function isRouteWithComponent(value: CreateRouteOptions): value is CreateRouteOptions & WithSingleComponent {
  return 'component' in value
}

export function isRouteWithComponents(value: CreateRouteOptions): value is CreateRouteOptions & WithComponentRecord {
  return 'components' in value
}

export function isRouteWithoutComponent(value: CreateRouteOptions): value is Omit<CreateRouteOptions, 'component' | 'components'> {
  return !isRouteWithComponent(value) && !isRouteWithComponents(value)
}

// type ParentPath<TParent extends Route | undefined> = TParent extends Route ? TParent['path'] : Path<'', {}>
// type ParentQuery<TParent extends Route | undefined> = TParent extends Route ? TParent['query'] : Query<'', {}>
// type CombineParams<
//   TPath extends string | Path | undefined = string | Path | undefined,
//   TQuery extends string | Query | undefined = string | Query | undefined,
//   THost extends string | Host | undefined = string | Host | undefined,
//   TParent extends Route | undefined = undefined
// > = CombinePath<ParentPath<TParent>, ToPath<TPath>>['params'] & CombineQuery<ParentQuery<TParent>, ToQuery<TQuery>>['params'] & ToHost<THost>['params']

export type CreateRouteOptions<
  TName extends string | undefined = string,
  TPath extends string | Path | undefined = string | Path | undefined,
  TQuery extends string | Query | undefined = string | Query | undefined,
  THost extends string | Host | undefined = string | Host | undefined,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _TParent extends Route | undefined = undefined
> = WithComponent & WithHooks & {
  /**
   * Name for route, used to create route keys and in navigation.
   */
  name?: TName,
  /**
   * Host part of URL.
   */
  host?: THost,
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

export type CreateRouteOptionsWithoutParent<
  TName extends string | undefined = undefined,
  TPath extends string | Path | undefined = undefined,
  TQuery extends string | Query | undefined = undefined,
  THost extends string | Host | undefined = undefined
> = CreateRouteOptions<TName, TPath, TQuery, THost> & {
  parent?: never,
}

export type CreateRouteOptionsWithParent<
  TParent extends Route,
  TName extends string | undefined = undefined,
  TPath extends string | Path | undefined = undefined,
  TQuery extends string | Query | undefined = undefined,
  THost extends string | Host | undefined = undefined
> = CreateRouteOptions<TName, TPath, TQuery, THost, TParent> & {
  parent: TParent,
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