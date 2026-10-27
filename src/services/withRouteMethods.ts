import { InternalRouteHooks } from '@/types/hooks'
import { addRedirect } from '@/services/addRedirect'
import { RouteRedirectFrom, RouteRedirectTo, RedirectToArgs } from '@/types/redirects'
import { AddAlias, createAliases } from '@/services/addAlias'
import { AddLoader, addLoaderToMatch, checkForLoaderConflict, toLoader } from '@/services/addLoader'
import { AddView, addViewToMatch, toView } from '@/services/addView'
import { CreatedRouteOptions, isRoute, Route } from '@/types/route'
import { combineContext } from '@/services/combineContext'

type NextMatch = (match: CreatedRouteOptions) => CreatedRouteOptions

/**
 * Attaches methods and callbacks to the current route copy. Chaining a view, loader, or alias
 * rebuilds the route and reattaches its methods.
 */
export function withRouteMethods<TRoute extends Route>(route: TRoute, hooks: InternalRouteHooks): TRoute {
  function withNextMatch(next: NextMatch): TRoute {
    const currentMatch = route.matches.at(-1)

    // Created routes always have a match; this check narrows the array access for TypeScript.
    if (!currentMatch) {
      throw new Error('Expected the route to have at least one match')
    }

    const nextMatch = next(currentMatch)

    return withRouteMethods({
      ...route,
      context: combineContext(route.context, nextMatch.context),
      matches: [...route.matches.slice(0, -1), nextMatch],
    }, hooks)
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
      return withRouteMethods(route, hooks)
    }

    const aliases = createAliases(match, options, transform)

    return withRouteMethods({
      ...route,
      aliases: [...route.aliases, ...aliases],
    }, hooks)
  }

  const redirectTo: RouteRedirectTo = (...[to, convertParams, options]: RedirectToArgs) => {
    addRedirect(route, to, convertParams, options)
  }

  const redirectFrom: RouteRedirectFrom = (from, convertParams, options) => {
    addRedirect(from, route, convertParams, options)
  }

  const onBeforeRouteEnter: (...args: Parameters<InternalRouteHooks['onBeforeRouteEnter']>) => TRoute = (hook, options) => {
    hooks.onBeforeRouteEnter(hook, options)

    return result
  }

  const onBeforeRouteUpdate: (...args: Parameters<InternalRouteHooks['onBeforeRouteUpdate']>) => TRoute = (hook, options) => {
    hooks.onBeforeRouteUpdate(hook, options)

    return result
  }

  const onBeforeRouteLeave: (...args: Parameters<InternalRouteHooks['onBeforeRouteLeave']>) => TRoute = (hook, options) => {
    hooks.onBeforeRouteLeave(hook, options)

    return result
  }

  const onAfterRouteEnter: (...args: Parameters<InternalRouteHooks['onAfterRouteEnter']>) => TRoute = (hook, options) => {
    hooks.onAfterRouteEnter(hook, options)

    return result
  }

  const onAfterRouteUpdate: (...args: Parameters<InternalRouteHooks['onAfterRouteUpdate']>) => TRoute = (hook, options) => {
    hooks.onAfterRouteUpdate(hook, options)

    return result
  }

  const onAfterRouteLeave: (...args: Parameters<InternalRouteHooks['onAfterRouteLeave']>) => TRoute = (hook, options) => {
    hooks.onAfterRouteLeave(hook, options)

    return result
  }

  const result = {
    ...route,
    addView,
    addLoader,
    addAlias,
    redirectTo,
    redirectFrom,
    onBeforeRouteEnter,
    onBeforeRouteUpdate,
    onBeforeRouteLeave,
    onAfterRouteEnter,
    onAfterRouteUpdate,
    onAfterRouteLeave,
  }

  return result
}
