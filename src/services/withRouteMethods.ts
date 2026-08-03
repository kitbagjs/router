import { AddLoader, addLoaderToMatch, checkForLoaderConflict, toLoader } from '@/services/addLoader'
import { AddView, addViewToMatch, toView } from '@/services/addView'
import { CreatedRouteOptions, Route } from '@/types/route'

type NextMatch = (match: CreatedRouteOptions) => CreatedRouteOptions

/**
 * Attaches the chainable, immutable route methods — `addView` and `addLoader`. Each call rebuilds the
 * route's own (last) match and returns a new route with the methods re-attached, so neither mutates the
 * route it was called on, and chaining one never drops the other.
 */
export function withRouteMethods<TRoute extends Route>(route: TRoute): TRoute {
  function withNextMatch(next: NextMatch): TRoute {
    const currentMatch = route.matches.at(-1)

    if (!currentMatch) {
      return withRouteMethods(route)
    }

    return withRouteMethods({
      ...route,
      matches: [...route.matches.slice(0, -1), next(currentMatch)],
    })
  }

  const addView: AddView = (component, options) => {
    const view = toView(component, options)

    return withNextMatch((match) => addViewToMatch(match, view))
  }

  const addLoader: AddLoader = (load, options) => {
    const loader = toLoader(load, options)

    checkForLoaderConflict(route.matches.slice(0, -1), loader.name)

    return withNextMatch((match) => addLoaderToMatch(match, loader))
  }

  return {
    ...route,
    addView,
    addLoader,
  }
}
