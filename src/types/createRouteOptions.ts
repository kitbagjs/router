import { Component } from 'vue'
import { CombineHash, combineHash } from '@/services/combineHash'
import { CombineMeta, combineMeta } from '@/services/combineMeta'
import { CombinePath, combinePath } from '@/services/combinePath'
import { CombineQuery, combineQuery } from '@/services/combineQuery'
import { CombineState, combineState } from '@/services/combineState'
import { Hash, ToHash } from '@/types/hash'
import { Host } from '@/types/host'
import { Param } from '@/types/paramTypes'
import { Path, ToPath } from '@/types/path'
import { PrefetchConfig } from '@/types/prefetch'
import { Query, ToQuery } from '@/types/query'
import { RouteMeta } from '@/types/register'
import { Route } from '@/types/route'
import { ResolvedRoute } from './resolved'
import { ComponentProps } from '@/services/component'
import { PropsCallbackContext } from './props'
import { MaybePromise } from './utilities'
import { RouterView } from '@/components'
import { ToMeta } from './meta'
import { ToState } from './state'
import { ToName } from './name'
import { WithHooks } from './hooks'

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

export function isWithComponent<T extends Record<string, unknown>>(options: T): options is T & { component: Component } {
  return 'component' in options && Boolean(options.component)
}

export function isWithComopnentProps<T extends Record<string, unknown>>(options: T): options is T & { props: PropsGetter } {
  return 'props' in options && typeof options.props === 'function'
}

export function isWithComponents<T extends Record<string, unknown>>(options: T): options is T & { components: Record<string, Component> } {
  return 'components' in options && Boolean(options.components)
}

export function isWithComponentPropsRecord<T extends Record<string, unknown>>(options: T): options is T & { props: RoutePropsRecord } {
  return 'props' in options && typeof options.props === 'object'
}

export function isWithState<T extends Record<string, unknown>>(options: T): options is T & { state: Record<string, Param> } {
  return 'state' in options && Boolean(options.state)
}

export type CreateRouteOptions<
  TName extends string | undefined = string | undefined,
  TPath extends string | Path | undefined = string | Path | undefined,
  TQuery extends string | Query | undefined = string | Query | undefined,
  THash extends string | Hash | undefined = string | Hash | undefined,
  TMeta extends RouteMeta = RouteMeta
> = WithHooks & {
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
   * Hash part of URL.
   */
  hash?: THash,
  /**
   * Represents additional metadata associated with a route, customizable via declaration merging.
   */
  meta?: TMeta,
  /**
   * Determines what assets are prefetched when router-link is rendered for this route. Overrides router level prefetch.
   */
  prefetch?: PrefetchConfig,
  /**
   * Type params for additional data intended to be stored in history state, all keys will be optional unless a default is provided.
   */
  state?: Record<string, Param>,
  /**
   * An optional parent route to nest this route under.
   */
  parent?: Route,
  /**
   * An optional component to render when this route is matched.
   *
   * @default RouterView
   */
  component?: Component,
  /**
   * An object of named components to render using named views
   */
  components?: Record<string, Component>,
  /**
   * Props have been moved to the second argument of `createRoute`. This property can no longer be used.
   *
   * @deprecated
   */
  props?: never,
}

export type PropsGetter<
  TOptions extends CreateRouteOptions = CreateRouteOptions,
  TComopnent extends Component = Component
> = (route: ResolvedRoute<ToRoute<TOptions, undefined>>, context: PropsCallbackContext) => MaybePromise<ComponentProps<TComopnent>>

type ComponentPropsAreOptional<
  TComponent extends Component
> = Partial<ComponentProps<TComponent>> extends ComponentProps<TComponent>
  ? true
  : false

type RoutePropsRecord<
  TOptions extends CreateRouteOptions = CreateRouteOptions,
  TComponents extends Record<string, Component> = Record<string, Component>
> = { [K in keyof TComponents as ComponentPropsAreOptional<TComponents[K]> extends true ? K : never]?: PropsGetter<TOptions, TComponents[K]> }
& { [K in keyof TComponents as ComponentPropsAreOptional<TComponents[K]> extends false ? K : never]: PropsGetter<TOptions, TComponents[K]> }

export type CreateRouteProps<
  TOptions extends CreateRouteOptions = CreateRouteOptions
> = TOptions['component'] extends Component
  ? PropsGetter<TOptions, TOptions['component']>
  : TOptions['components'] extends Record<string, Component>
    ? RoutePropsRecord<TOptions, TOptions['components']>
    : PropsGetter<TOptions, typeof RouterView>

type ToMatch<
  TOptions extends CreateRouteOptions,
  TProps extends CreateRouteProps<TOptions> | undefined
> = Route<
  ToName<TOptions['name']>,
  Host<'', {}>,
  ToPath<TOptions['path']>,
  ToQuery<TOptions['query']>,
  ToHash<TOptions['hash']>,
  ToMeta<TOptions['meta']>,
  ToState<TOptions['state']>
> & { props: TProps }

type ToMatches<
  TOptions extends CreateRouteOptions,
  TProps extends CreateRouteProps<TOptions> | undefined
> = TOptions extends { parent: infer TParent extends Route }
  ? [...TParent['matches'], ToMatch<TOptions, TProps>]
  : [ToMatch<TOptions, TProps>]

export type ToRoute<
  TOptions extends CreateRouteOptions,
  TProps extends CreateRouteProps<TOptions> | undefined
> = TOptions extends { parent: infer TParent extends Route }
  ? Route<
    ToName<TOptions['name']>,
    Host<'', {}>,
    CombinePath<ToPath<TParent['path']>, ToPath<TOptions['path']>>,
    CombineQuery<ToQuery<TParent['query']>, ToQuery<TOptions['query']>>,
    CombineHash<ToHash<TParent['hash']>, ToHash<TOptions['hash']>>,
    CombineMeta<ToMeta<TParent['meta']>, ToMeta<TOptions['meta']>>,
    CombineState<ToState<TParent['state']>, ToState<TOptions['state']>>,
    ToMatches<TOptions, TProps>
  >
  : Route<
    ToName<TOptions['name']>,
    Host<'', {}>,
    ToPath<TOptions['path']>,
    ToQuery<TOptions['query']>,
    ToHash<TOptions['hash']>,
    ToMeta<TOptions['meta']>,
    ToState<TOptions['state']>,
    ToMatches<TOptions, TProps>
  >

export function combineRoutes(parent: Route, child: Route): Route {
  return {
    ...child,
    path: combinePath(parent.path, child.path),
    query: combineQuery(parent.query, child.query),
    meta: combineMeta(parent.meta, child.meta),
    state: combineState(parent.state, child.state),
    hash: combineHash(parent.hash, child.hash),
    matches: [...parent.matches, child.matched],
    host: parent.host,
    depth: parent.depth + 1,
  }
}
