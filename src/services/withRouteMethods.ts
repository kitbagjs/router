import { createRouteRedirects } from '@/services/createRouteRedirects'
import { AddAlias, createAliases } from '@/services/addAlias'
import { AddLoader, addLoaderToMatch, checkForLoaderConflict, toLoader } from '@/services/addLoader'
import { AddView, addViewToMatch, toView } from '@/services/addView'
import { CreatedRouteOptions, isRoute, Route } from '@/types/route'
import { RouteContext } from '@/types/routeContext'
import { combineContext } from '@/services/combineContext'

type NextMatch = (match: CreatedRouteOptions) => CreatedRouteOptions

/**
 * Attaches methods and callbacks to the current route copy. Chaining a view, loader, or alias
 * rebuilds the route and reattaches its methods.
 */
export function withRouteMethods<TRoute extends Route>(route: TRoute): TRoute {
  function withNextMatch(next: NextMatch, context: RouteContext[] = route.context): TRoute {
    const currentMatch = route.matches.at(-1)

    if (!currentMatch) {
      return withRouteMethods(route)
    }

    return withRouteMethods({
      ...route,
      context,
      matches: [...route.matches.slice(0, -1), next(currentMatch)],
    })
  }

  const addView: AddView = (component, options) => {
    const view = toView(component, options)

    return withNextMatch((match) => addViewToMatch(match, view), combineContext(route.context, view.context))
  }

  const addLoader: AddLoader = (load, options) => {
    const loader = toLoader(load, options)

    checkForLoaderConflict(route.matches.slice(0, -1), loader.name)

    return withNextMatch((match) => addLoaderToMatch(match, loader), combineContext(route.context, loader.context))
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

  const redirects = createRouteRedirects({ getRoute: () => result })
  const result = {
    ...route,
    ...redirects,
    addView,
    addLoader,
    addAlias,
  }

  return result
}
