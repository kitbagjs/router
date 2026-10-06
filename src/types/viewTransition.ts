import { ResolvedRoute, RouterResolvedRouteUnion } from '@/types/resolved'
import { Rejection } from '@/types/rejection'
import { CreatedRouteOptions, Routes } from '@/types/route'

/**
 * Types set on a view transition, which css targets with `:active-view-transition-type()`.
 */
export type ViewTransitionTypes = string[]

/**
 * The page a view transition captures: a matched route or a rejection.
 */
export type ViewTransitionTarget = ResolvedRoute | Rejection

/** The outgoing and incoming pages captured by the browser. */
export type ViewTransitionContext = {
  to: ViewTransitionTarget,
  from: ViewTransitionTarget,
}

/**
 * Decides the types for a navigation. Returning `false` skips the transition for that navigation.
 */
export type ViewTransitionTypesCallback = (context: ViewTransitionContext) => ViewTransitionTypes | false

export type ViewTransitionConfigOptions = {
  /**
   * Types set on the transition, combined with the types of every other level that applies.
   */
  types?: ViewTransitionTypes | ViewTransitionTypesCallback,
}

/**
 * Whether a navigation animates with the View Transitions API. A boolean enables or disables the
 * transition, an array of types or an options object enables it.
 */
export type ViewTransitionConfig = boolean | ViewTransitionTypes | ViewTransitionConfigOptions

export type ViewTransitionConfigs = {
  routerViewTransition?: ViewTransitionConfig,
  routeViewTransition?: ViewTransitionConfig,
  navigationViewTransition?: ViewTransitionConfig,
}

/**
 * The view transition in flight, from the moment a navigation is decided to transition until its
 * animation finishes. `to` and `from` are known throughout, so the page being left can prepare its elements
 * before it is captured. `transition` is set once the browser has been asked to transition.
 */
export type RouterViewTransition<TRoutes extends Routes = Routes> = {
  readonly isTransitioning: boolean,
  readonly to: RouterResolvedRouteUnion<TRoutes> | Rejection | undefined,
  readonly from: RouterResolvedRouteUnion<TRoutes> | Rejection | undefined,
  readonly types: ViewTransitionTypes,
  readonly transition: ViewTransition | undefined,
}

export function hasViewTransition(match: CreatedRouteOptions): match is CreatedRouteOptions & { viewTransition: ViewTransitionConfig } {
  return match.viewTransition !== undefined
}
