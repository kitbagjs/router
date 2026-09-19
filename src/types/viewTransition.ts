import { ResolvedRoute } from '@/types/resolved'

/**
 * Types set on a view transition, which css targets with `:active-view-transition-type()`.
 */
export type ViewTransitionTypes = string[]

/**
 * The navigation a view transition animates. There is always a route to animate from, since the first
 * navigation never transitions.
 */
export type ViewTransitionContext = {
  to: ResolvedRoute,
  from: ResolvedRoute,
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
