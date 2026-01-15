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
import { ToMeta } from './meta'
import { ToState } from './state'
import { ToName } from './name'
import { ToWithParams, WithParams } from '@/services/withParams'
import { RouteContext, ToRouteContext } from './routeContext'
import { RouterViewProps } from '@/components/routerView'
import { createUrl, CreateUrlOptions } from '@/services/createUrl'
import { Url } from '@/types/url'

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
  TMeta extends RouteMeta = RouteMeta
> = CreateUrlOptions & {
  /**
   * Name for route, used to create route keys and in navigation.
   */
  name?: TName,
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
   * Related routes and rejections for the route. The context is exposed to the hooks and props callback functions for this route.
   */
  context?: RouteContext[],
}

export type PropsGetter<
  TOptions extends CreateRouteOptions = CreateRouteOptions,
  TComponent extends Component = Component
> = (route: ResolvedRoute<ToRoute<TOptions>>, context: PropsCallbackContext<ToRoute<TOptions>, TOptions>) => MaybePromise<ComponentProps<TComponent>>

export type RouterViewPropsGetter<
  TOptions extends CreateRouteOptions = CreateRouteOptions
> = (route: ResolvedRoute<ToRoute<TOptions>>, context: PropsCallbackContext<ToRoute<TOptions>, TOptions>) => MaybePromise<RouterViewProps & Record<string, unknown>>

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
    : RouterViewPropsGetter<TOptions>

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
  TProps extends CreateRouteProps<TOptions> | undefined = undefined
> = CreateRouteOptions extends TOptions
  ? Route
  : TOptions extends { parent: infer TParent extends Route }
    ? Route<
      ToName<TOptions['name']>,
      TParent['host'],
      CombinePath<TParent['path'], ToWithParams<TOptions['path']>>,
      CombineQuery<TParent['query'], ToWithParams<TOptions['query']>>,
      CombineHash<TParent['hash'], ToWithParams<TOptions['hash']>>,
      CombineMeta<ToMeta<TParent['meta']>, ToMeta<TOptions['meta']>>,
      CombineState<ToState<TParent['state']>, ToState<TOptions['state']>>,
      ToMatches<TOptions, CreateRouteProps<TOptions> extends TProps ? undefined : TProps>,
      [...ToRouteContext<TParent['context']>, ...ToRouteContext<TOptions['context']>]
    >
    : Route<
      ToName<TOptions['name']>,
      TOptions extends { host: string | WithParams } ? ToWithParams<TOptions['host']> : WithParams<'', {}>,
      ToWithParams<TOptions['path']>,
      ToWithParams<TOptions['query']>,
      ToWithParams<TOptions['hash']>,
      ToMeta<TOptions['meta']>,
      ToState<TOptions['state']>,
      ToMatches<TOptions, CreateRouteProps<TOptions> extends TProps ? undefined : TProps>,
      ToRouteContext<TOptions['context']>
    >

export function combineRoutes(parent: Route, child: Route): Route {
  const url = createUrl({
    host: parent.host,
    path: combinePath(parent.path, child.path),
    query: combineQuery(parent.query, child.query),
    hash: combineHash(parent.hash, child.hash),
  })

  return {
    ...child,
    ...url,
    meta: combineMeta(parent.meta, child.meta),
    state: combineState(parent.state, child.state),
    hooks: [...parent.hooks, ...child.hooks],
    matches: [...parent.matches, child.matched],
    context: [...parent.context, ...child.context],
    depth: parent.depth + 1,
  }
}
