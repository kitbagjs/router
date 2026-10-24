import { addRedirect } from '@/services/addRedirect'
import { RouteRedirectFrom, RouteRedirectTo, RedirectToArgs } from '@/types/redirects'
import { AddAlias, createAliases } from '@/services/addAlias'
import { AddLoader, addLoaderToMatch, checkForLoaderConflict, toNamedLoader } from '@/services/addLoader'
import { AddView, addViewToMatch, toView } from '@/services/addView'
import { CreatedRouteOptions, isRoute, Route } from '@/types/route'
import { combineContext } from '@/services/combineContext'

type NextMatch = (match: CreatedRouteOptions) => CreatedRouteOptions

/**
 * Attaches methods and callbacks to the current route copy. Chaining a view, loader, or alias
 * rebuilds the route and reattaches its methods.
 */
export function withRouteMethods<TRoute extends Route>(route: TRoute): TRoute {
  function withNextMatch(next: NextMatch): TRoute {
    const currentMatch = route.matches.at(-1)

    if (!currentMatch) {
      return withRouteMethods(route)
    }

    const nextMatch = next(currentMatch)

    return withRouteMethods({
      ...route,
      context: combineContext(route.context, nextMatch.context),
      matches: [...route.matches.slice(0, -1), nextMatch],
    })
  }

  const addView: AddView = (component, options) => {
    const view = toView(component, options)

    return withNextMatch((match) => addViewToMatch(match, view))
  }

  const addLoader: AddLoader = (load, options) => {
    const loader = toNamedLoader(load, options)

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

  const redirectTo: RouteRedirectTo = (...[to, convertParams, options]: RedirectToArgs) => {
    addRedirect(route, to, convertParams, options)
  }

  const redirectFrom: RouteRedirectFrom = (from, convertParams, options) => {
    addRedirect(from, route, convertParams, options)
  }

  return {
    ...route,
    addView,
    addLoader,
    addAlias,
    redirectTo,
    redirectFrom,
  }
}
