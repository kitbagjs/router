import { RouteSetTitle, SetRouteTitle } from '@/types/routeTitle'
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
  type HookMethods = InternalRouteHooks<Route, undefined, TRoute>

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

    // Created routes always have a match and internal metadata; this check narrows their types for TypeScript.
    if (!match || !isRoute(route)) {
      throw new Error('Expected a created route with at least one match')
    }

    const aliases = createAliases(match, options, transform)

    return withRouteMethods({
      ...route,
      aliases: [...route.aliases, ...aliases],
    }, hooks)
  }

  const redirectTo: RouteRedirectTo<Route, TRoute> = (...[to, convertParams, options]: RedirectToArgs) => {
    addRedirect(route, to, convertParams, options)

    return result
  }

  const redirectFrom: RouteRedirectFrom<Route, TRoute> = (from, convertParams, options) => {
    addRedirect(from, route, convertParams, options)

    return result
  }

  const setTitle: SetRouteTitle = (callback) => {
    const title = route as TRoute & RouteSetTitle

    title.setTitle(callback)

    return result
  }

  const onBeforeRouteEnter: HookMethods['onBeforeRouteEnter'] = (hook, options) => {
    hooks.onBeforeRouteEnter(hook, options)

    return result
  }

  const onBeforeRouteUpdate: HookMethods['onBeforeRouteUpdate'] = (hook, options) => {
    hooks.onBeforeRouteUpdate(hook, options)

    return result
  }

  const onBeforeRouteLeave: HookMethods['onBeforeRouteLeave'] = (hook, options) => {
    hooks.onBeforeRouteLeave(hook, options)

    return result
  }

  const onAfterRouteEnter: HookMethods['onAfterRouteEnter'] = (hook, options) => {
    hooks.onAfterRouteEnter(hook, options)

    return result
  }

  const onAfterRouteUpdate: HookMethods['onAfterRouteUpdate'] = (hook, options) => {
    hooks.onAfterRouteUpdate(hook, options)

    return result
  }

  const onAfterRouteLeave: HookMethods['onAfterRouteLeave'] = (hook, options) => {
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
    setTitle,
    onBeforeRouteEnter,
    onBeforeRouteUpdate,
    onBeforeRouteLeave,
    onAfterRouteEnter,
    onAfterRouteUpdate,
    onAfterRouteLeave,
  }

  return result
}
