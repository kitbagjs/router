import { Component } from 'vue'
import { CombineHash, combineHash } from '@/services/combineHash'
import { CombineMeta, combineMeta } from '@/services/combineMeta'
import { CombinePath, combinePath } from '@/services/combinePath'
import { CombineQuery, combineQuery } from '@/services/combineQuery'
import { CombineState, combineState } from '@/services/combineState'
import { Param } from '@/types/paramTypes'
import { PrefetchConfig } from '@/types/prefetch'
import { RouteMeta } from '@/types/register'
import { Route } from '@/types/route'
import { ResolvedRoute } from './resolved'
import { ComponentProps } from '@/services/component'
import { PropsCallbackContext } from './props'
import { MaybePromise } from './utilities'
import { RouterView } from '@/main'
import { ToMeta } from './meta'
import { ToState } from './state'
import { ToName } from './name'
import { WithHooks } from './hooks'
import { ToWithParams, WithParams } from '@/services/withParams'

export type WithHost<THost extends string | WithParams = string | WithParams> = {
  /**
   * Host part of URL.
   */
  host: THost,
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

export function isWithComponentProps<T extends Record<string, unknown>>(options: T): options is T & { props: PropsGetter } {
  return 'props' in options && typeof options.props === 'function'
}

export function isWithComponents<T extends Record<string, unknown>>(options: T): options is T & { components: Record<string, Component> } {
  return 'components' in options && Boolean(options.components)
}

export function isWithComponentPropsRecord<T extends Record<string, unknown>>(options: T): options is T & { props: RoutePropsRecord } {
  return 'props' in options && typeof options.props === 'object'
}

export type CreateRouteOptions<
  TName extends string | undefined = string | undefined,
  TPath extends string | WithParams | undefined = string | WithParams | undefined,
  TQuery extends string | WithParams | undefined = string | WithParams | undefined,
  THash extends string | WithParams | undefined = string | WithParams | undefined,
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
  TComponent extends Component = Component
> = (route: ResolvedRoute<ToRoute<TOptions, undefined>>, context: PropsCallbackContext<TOptions['parent']>) => MaybePromise<ComponentProps<TComponent>>

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
> = Omit<TOptions, 'props' | 'meta'> & {
  id: string,
  props: TProps,
  /**
   * Represents additional metadata associated with a route. Always present, defaults to empty object.
   */
  meta: ToMeta<TOptions['meta']>,
}

type ToMatches<
  TOptions extends CreateRouteOptions,
  TProps extends CreateRouteProps<TOptions> | undefined
> = TOptions extends { parent: infer TParent extends Route }
  ? [...TParent['matches'], ToMatch<TOptions, TProps>]
  : [ToMatch<TOptions, TProps>]

export type ToRoute<
  TOptions extends CreateRouteOptions,
  TProps extends CreateRouteProps<TOptions> | undefined
> = CreateRouteOptions extends TOptions
  ? Route
  : TOptions extends { parent: infer TParent extends Route }
    ? Route<
      ToName<TOptions['name']>,
      ToWithParams<TParent['host']>,
      CombinePath<ToWithParams<TParent['path']>, ToWithParams<TOptions['path']>>,
      CombineQuery<ToWithParams<TParent['query']>, ToWithParams<TOptions['query']>>,
      CombineHash<ToWithParams<TParent['hash']>, ToWithParams<TOptions['hash']>>,
      CombineMeta<ToMeta<TParent['meta']>, ToMeta<TOptions['meta']>>,
      CombineState<ToState<TParent['state']>, ToState<TOptions['state']>>,
      ToMatches<TOptions, TProps>
    >
    : Route<
      ToName<TOptions['name']>,
      TOptions extends { host: string | WithParams } ? ToWithParams<TOptions['host']> : WithParams<'', {}>,
      ToWithParams<TOptions['path']>,
      ToWithParams<TOptions['query']>,
      ToWithParams<TOptions['hash']>,
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
