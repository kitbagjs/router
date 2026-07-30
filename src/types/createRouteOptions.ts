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
import { MaybePromise } from '@/types/utilities'
import { ToMeta } from '@/types/meta'
import { ToName } from '@/types/name'
import { UrlPart, UrlQueryPart } from '@/services/withParams'
import { RouteContext } from '@/types/routeContext'
import { ToUrl } from '@/types/url'
import { CombineUrl } from '@/services/combineUrl'

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
   * Related routes and rejections for the route. The context is exposed to the hooks and props callback functions for this route.
   */
  context?: RouteContext[],
  /**
   * When true, the route will be hoisted to the top of the route tree. The route will continue to inherit meta, state, hooks, matches, and context from it's parent, but not the "url" properties.
   */
  hoist?: boolean,
  /**
   * @deprecated Removed. Use `addView` instead: `createRoute({ ... }).addView(component)`.
   */
  component?: 'component was removed, use addView instead',
  /**
   * @deprecated Removed. Use `addView` with a name instead: `createRoute({ ... }).addView(component, { name })`.
   */
  components?: 'components was removed, use addView with a name instead',
}

export type PropsGetter<
  TOptions extends CreateRouteOptions = CreateRouteOptions,
  TComponent extends Component = Component
> = (route: ResolvedRoute<ToRoute<TOptions>>, context: PropsCallbackContext<ToRoute<TOptions>, TOptions>) => MaybePromise<ComponentProps<TComponent>>

export type ComponentPropsAreOptional<
  TComponent extends Component
> = Partial<ComponentProps<TComponent>> extends ComponentProps<TComponent>
  ? true
  : false

type ToMatch<
  TOptions extends CreateRouteOptions
> = Omit<TOptions, 'meta' | 'name' | 'parent'> & {
  id: string,
  name: ToName<TOptions['name']>,
  /**
   * Represents additional metadata associated with a route. Always present, defaults to empty object.
   */
  meta: ToMeta<TOptions['meta']>,
  /**
   * The views this route renders, keyed by view name. Added by `addView`.
   */
  views: {},
}

/**
 * The matches for a route, from greatest ancestor to the route itself. Each carries its own views, so
 * there is no second tuple to keep aligned with this one.
 */
type ToMatches<
  TOptions extends CreateRouteOptions
> = TOptions extends { parent: infer TParent extends Route }
  ? [...TParent['matches'], ToMatch<TOptions>]
  : [ToMatch<TOptions>]

/**
 * The url a route resolves to, combined with its parent's unless the route is hoisted.
 */
export type ToRouteUrl<
  TOptions extends CreateRouteOptions
> = TOptions extends { parent: infer TParent extends Route }
  ? TOptions['hoist'] extends true ? ToUrl<TOptions> : CombineUrl<TParent, ToUrl<TOptions>>
  : ToUrl<TOptions>

/**
 * The matches for a route, with the props argument resolved to the views of its own match.
 */
export type ToRouteMatches<
  TOptions extends CreateRouteOptions
> = ToMatches<TOptions>

export type ToRoute<
  TOptions extends CreateRouteOptions
> = CreateRouteOptions extends TOptions
  ? Route
  : Route<ToRouteUrl<TOptions>, ToRouteMatches<TOptions>>

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
