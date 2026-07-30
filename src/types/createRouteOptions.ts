import { Component } from 'vue'
import { combineMeta } from '@/services/combineMeta'
import { combineState } from '@/services/combineState'
import { combineHooks } from '@/types/hooks'
import { Param } from '@/types/paramTypes'
import { PrefetchConfig } from '@/types/prefetch'
import { RouteMeta } from '@/types/register'
import { isRoute, Route, RouteInternal } from '@/types/route'
import { ResolvedRoute } from './resolved'
import { ComponentProps } from '@/services/component'
import { PropsCallbackContext } from '@/types/props'
import { AnyFunction, Identity, MaybePromise } from '@/types/utilities'
import { ToMeta } from '@/types/meta'
import { ToName } from '@/types/name'
import { UrlPart, UrlQueryPart } from '@/services/withParams'
import { RouteContext } from '@/types/routeContext'
import { RouterViewProps } from '@/components/routerView'
import { ToUrl } from '@/types/url'
import { CombineUrl } from '@/services/combineUrl'
import { RouteView } from '@/types/routeViews'

export type WithHost<THost extends string | UrlPart = string | UrlPart> = {
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

/**
 * This type is used to strip the component and components properties from the options object
 * when creating a Route to simplify and minimize the output type.
 */
type WithoutComponents = { component: never, components: never }

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
> = {
  /**
   * Name for route, used to create route keys and in navigation.
   */
  name?: TName,
  /**
   * Path part of URL.
   */
  path?: string | UrlPart | undefined,
  /**
   * Query (aka search) part of URL.
   */
  query?: string | UrlQueryPart | undefined,
  /**
   * Hash part of URL.
   */
  hash?: string | UrlPart | undefined,
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
   * @deprecated Use the chainable `addView` method on the route instead: `createRoute({ ... }).addView(component, { props })`.
   */
  component?: Component,
  /**
   * An object of named components to render using named views
   *
   * @deprecated Use the chainable `addView` method on the route instead: `createRoute({ ... }).addView(component, { name, props })`.
   */
  components?: Record<string, Component>,
  /**
   * Related routes and rejections for the route. The context is exposed to the hooks and props callback functions for this route.
   */
  context?: RouteContext[],
  /**
   * When true, the route will be hoisted to the top of the route tree. The route will continue to inherit meta, state, hooks, matches, and context from it's parent, but not the "url" properties.
   */
  hoist?: boolean,
}

export type PropsGetter<
  TOptions extends CreateRouteOptions = CreateRouteOptions,
  TComponent extends Component = Component
> = (route: ResolvedRoute<ToRoute<TOptions>>, context: PropsCallbackContext<ToRoute<TOptions>, TOptions>) => MaybePromise<ComponentProps<TComponent>>

export type RouterViewPropsGetter<
  TOptions extends CreateRouteOptions = CreateRouteOptions
> = (route: ResolvedRoute<ToRoute<TOptions>>, context: PropsCallbackContext<ToRoute<TOptions>, TOptions>) => MaybePromise<RouterViewProps & Record<string, unknown>>

export type ComponentPropsAreOptional<
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
  TProps = undefined
> = Omit<TOptions, 'meta' | 'name' | 'component' | 'components' | 'parent'> & {
  id: string,
  name: ToName<TOptions['name']>,
  /**
   * Represents additional metadata associated with a route. Always present, defaults to empty object.
   */
  meta: ToMeta<TOptions['meta']>,
  /**
   * The views this route renders, keyed by view name.
   */
  views: PropsToViews<TProps>,
}

/**
 * The matches for a route, from greatest ancestor to the route itself. Each carries its own views, so
 * there is no second tuple to keep aligned with this one.
 */
type ToMatches<
  TOptions extends CreateRouteOptions,
  TProps = undefined
> = TOptions extends { parent: infer TParent extends Route }
  ? [...TParent['matches'], ToMatch<TOptions, TProps>]
  : [ToMatch<TOptions, TProps>]

/**
 * Builds a views record from the props argument, which is either a single getter for the unnamed view or
 * a record of getters keyed by view name.
 */
type PropsToViews<TProps> = TProps extends AnyFunction
  ? { default: RouteView<TProps> }
  : TProps extends Record<string, AnyFunction>
    ? { [K in keyof TProps]: RouteView<TProps[K]> }
    : {}

/**
 * The url a route resolves to, combined with its parent's unless the route is hoisted.
 */
export type ToRouteUrl<
  TOptions extends CreateRouteOptions
> = TOptions extends { parent: infer TParent extends Route }
  ? TOptions['hoist'] extends true ? ToUrl<TOptions & WithoutComponents> : CombineUrl<TParent, ToUrl<TOptions & WithoutComponents>>
  : ToUrl<Identity<TOptions & WithoutComponents>>

/**
 * The matches for a route, with the props argument resolved to the views of its own match.
 */
export type ToRouteMatches<
  TOptions extends CreateRouteOptions,
  TProps
> = ToMatches<TOptions, CreateRouteProps<TOptions> extends TProps ? undefined : TProps>

export type ToRoute<
  TOptions extends CreateRouteOptions,
  TProps extends CreateRouteProps<TOptions> | undefined = undefined
> = CreateRouteOptions extends TOptions
  ? Route
  : Route<ToRouteUrl<TOptions>, ToRouteMatches<TOptions, TProps>>

export function combineRoutes(parent: Route, child: Route): Route {
  if (!isRoute(parent) || !isRoute(child)) {
    throw new Error('combineRoutes called with invalid route arguments')
  }

  const route = {
    ...child,
    meta: combineMeta(parent.meta, child.meta),
    state: combineState(parent.state, child.state),
    hooks: combineHooks(parent, child),
    matches: [...parent.matches, ...child.matches],
    context: [...parent.context, ...child.context],
    depth: parent.depth + 1,
  } satisfies Route & RouteInternal

  return route
}
