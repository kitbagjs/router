import { AddAlias, createAliases } from '@/services/addAlias'
import { AddLoader, addLoaderToMatch, checkForLoaderConflict, toLoader } from '@/services/addLoader'
import { AddView, addViewToMatch, toView } from '@/services/addView'
import { CreatedRouteOptions, isRoute, Route } from '@/types/route'

type NextMatch = (match: CreatedRouteOptions) => CreatedRouteOptions

/**
 * Attaches the chainable, immutable route methods — `addView`, `addLoader`, and `addAlias`. Each call
 * rebuilds the route's own (last) match, or its aliases, and returns a new route with the methods
 * re-attached, so none mutates the route it was called on, and chaining one never drops another.
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

  const addAlias: AddAlias = (options, transform) => {
    const match = route.matches.at(-1)

    if (!match || !isRoute(route)) {
      return withRouteMethods(route)
    }

    const aliases = createAliases(match, options, transform)

    return withRouteMethods({
      ...route,
      aliases: [...route.aliases, ...aliases],
    })
  }

  return {
    ...route,
    addView,
    addLoader,
    addAlias,
  }
}
