import { ResolvedRoute, RouteMiddleware, isNamedRoute } from '@/types'
import { asArray } from '@/utilities/array'
import { RouteHookLifeCycle, RouteHookType } from '@/utilities/createRouterHooks'
import { RouterRoute } from '@/utilities/createRouterRoute'
import { createRouterRouteQuery } from '@/utilities/createRouterRouteQuery'
import { getRouteParamValues, routeParamsAreValid } from '@/utilities/paramValidation'
import { routePathMatches, routeQueryMatches } from '@/utilities/routeMatchRegexRules'
import { getRouteScoreSortMethod } from '@/utilities/routeMatchScore'

export function getRouterRouteForUrl(routes: ResolvedRoute[], url: string): RouterRoute | undefined {
  const rules = [routePathMatches, routeQueryMatches, routeParamsAreValid]
  const sortByRouteScore = getRouteScoreSortMethod(url)

  const matches = routes
    .filter(route => rules.every(test => test(route, url)))
    .sort(sortByRouteScore)

  if (matches.length === 0) {
    return undefined
  }

  const [route] = matches
  const [, search] = url.split('?')
  const query = createRouterRouteQuery(search)
  const params = getRouteParamValues(route, url)

  return {
    matched: route.matched,
    matches: route.matches,
    name: route.name,
    query,
    params,
  }
}

export function getRoutePath(route: ResolvedRoute): string {
  return route.matches
    .filter(route => isNamedRoute(route))
    .map(route => route.name)
    .join('.')
}

function getRouterHookTypes(type: RouteHookType): RouteHookLifeCycle[] {
  if (type === 'before') {
    return ['onBeforeRouteEnter', 'onBeforeRouteUpdate', 'onBeforeRouteLeave']
  }

  throw 'not implemented'
}

export function getRouteHooks(route: RouterRoute | null, type: RouteHookType): RouteMiddleware[] {
  if (!route) {
    return []
  }

  const types = getRouterHookTypes(type)

  return route.matches.flatMap(route => types.flatMap(type => {
    const hooks = route[type]

    if (!hooks) {
      return []
    }

    return asArray(hooks)
  }))
}