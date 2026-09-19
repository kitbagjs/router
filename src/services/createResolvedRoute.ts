import { parseUrl, updateUrl } from '@/services/urlParser'
import { createResolvedRouteQuery } from '@/services/createResolvedRouteQuery'
import { getStateValues } from '@/services/state'
import { RouterResolveOptions } from '@/types/routerResolve'
import { ResolvedRoute } from '@/types/resolved'
import { isRoute, Route } from '@/types/route'
import { RouteAliasMatch } from '@/types/routeAlias'
import { UrlString } from '@/types/urlString'

type CreateResolvedRouteOptions = RouterResolveOptions & {
  /**
   * The alias the route was matched through, which is what `href` is built from instead of the route's
   * own url.
   */
  alias?: RouteAliasMatch,
}

type RouteUrls = {
  canonical: UrlString,
  href: UrlString,
}

/**
 * The route's own url and the url that matched, from the params each was given. The same url unless the
 * route was matched through an alias.
 */
function getRouteUrls(route: Route, params: Record<string, unknown>, alias: RouteAliasMatch | undefined): RouteUrls {
  const canonical = route.stringify(params)

  if (!alias) {
    return {
      canonical,
      href: canonical,
    }
  }

  return {
    canonical,
    href: alias.url.stringify(alias.params),
  }
}

type ResolvedUrls = RouteUrls & {
  query: URLSearchParams,
  hash: string,
}

/**
 * The urls with the query and hash the route did not declare applied to both, plus the query and hash the
 * resolved route ends up with.
 */
function getResolvedUrls(route: Route, params: Record<string, unknown>, options: CreateResolvedRouteOptions): ResolvedUrls {
  const urls = getRouteUrls(route, params, options.alias)
  const parts = {
    query: new URLSearchParams(options.query),
    hash: options.hash,
  }
  const canonical = updateUrl(urls.canonical, parts)
  const href = updateUrl(urls.href, parts)
  const { query, hash } = parseUrl(href)

  return { canonical, href, query, hash }
}

export function createResolvedRoute(route: Route, params: Record<string, unknown> = {}, options: CreateResolvedRouteOptions = {}): ResolvedRoute {
  const { canonical, href, query, hash } = getResolvedUrls(route, params, options)
  const matched = route.matches.at(-1)

  if (!matched) {
    throw new Error('createResolvedRoute called with a route that has no matches')
  }

  async function getTitle(): Promise<string | undefined> {
    if (!isRoute(route)) {
      return undefined
    }

    return route.getTitle(resolvedRoute)
  }

  const resolvedRoute: ResolvedRoute = {
    ...route,
    matched,
    query: createResolvedRouteQuery(query),
    state: getStateValues(route.state, options.state),
    hash,
    params,
    href,
    canonical,
    getTitle,
  }

  return resolvedRoute
}
