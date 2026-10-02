import { ViewTransitionConfig, ViewTransitionConfigs, ViewTransitionContext, ViewTransitionTypes } from '@/types/viewTransition'
import { isDefined } from './guards'

/**
 * The types to transition with, or `false` when the navigation should not transition. The nearest level
 * that sets the option decides whether it is on, and the types of every level that is on are combined.
 */
export function getViewTransitionTypes({ routerViewTransition, routeViewTransition, navigationViewTransition, ...context }: ViewTransitionConfigs & ViewTransitionContext): ViewTransitionTypes | false {
  const configs = [
    routerViewTransition,
    routeViewTransition,
    navigationViewTransition,
  ].filter(isDefined)
  const nearest = configs.at(-1)

  if (nearest === undefined || nearest === false) {
    return false
  }

  const types: ViewTransitionTypes = []

  for (const config of configs) {
    const value = getConfigTypes(config, context)

    if (value === false) {
      return false
    }

    types.push(...value)
  }

  return types
}

function getConfigTypes(config: ViewTransitionConfig, context: ViewTransitionContext): ViewTransitionTypes | false {
  if (typeof config === 'boolean') {
    return []
  }

  if (Array.isArray(config)) {
    return config
  }

  if (typeof config.types === 'function') {
    return config.types(context)
  }

  return config.types ?? []
}

export function supportsViewTransitions(): boolean {
  return typeof document !== 'undefined' && typeof document.startViewTransition === 'function'
}

/**
 * Passing types to a browser that predates them throws, so they are only passed where a transition has them.
 */
export function supportsViewTransitionTypes(): boolean {
  return typeof ViewTransition !== 'undefined' && 'types' in ViewTransition.prototype
}
