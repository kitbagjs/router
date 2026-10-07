import { parseUrl, updateUrl } from '@/services/urlParser'
import { createCanonicalUrl } from '@/services/createCanonicalUrl'
import { createResolvedRouteQuery } from '@/services/createResolvedRouteQuery'
import { getStateValues } from '@/services/state'
import { RouterResolveOptions } from '@/types/routerResolve'
import { IS_RESOLVED_ROUTE_SYMBOL, ResolvedRoute, ResolvedRouteInternal } from '@/types/resolved'
import { isRoute, Route } from '@/types/route'
import { RouteAliasMatch } from '@/types/routeAlias'
import { UrlString } from '@/types/urlString'
import { getHooks } from '@/types/hooks'

type CreateResolvedRouteOptions = RouterResolveOptions & {
  /**
   * The alias the route was matched through, which is what `href` is built from instead of the route's
   * own url.
   */
  alias?: RouteAliasMatch,
  /** An explicit address for a destination without a URL pattern. */
  url?: UrlString,
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
  if (options.url) {
    const href = updateUrl(options.url, options)
    const { query, hash } = parseUrl(href)

    return { canonical: href, href, query, hash }
  }

  const urls = getRouteUrls(route, params, options.alias)
  const parts = {
    query: new URLSearchParams(options.query),
    hash: options.hash,
  }
  const href = updateUrl(urls.href, parts)
  const canonical = createCanonicalUrl(href, {
    route,
    params,
    alias: options.alias,
  })
  const { query, hash } = parseUrl(href)

  return { canonical, href, query, hash }
}

export function createResolvedRoute(route: Route, params: Record<string, unknown> = {}, options: CreateResolvedRouteOptions = {}): ResolvedRoute {
  const { canonical, href, query, hash } = getResolvedUrls(route, params, options)
  const matched = route.matches.at(-1)

  if (!matched) {
    throw new Error('createResolvedRoute called with a route that has no matches')
  }

  async function getRouteTitle(to: ResolvedRoute): Promise<string | undefined> {
    if (!isRoute(route)) {
      return undefined
    }

    return route.getTitle(to)
  }

  const resolvedRoute: ResolvedRoute & ResolvedRouteInternal = {
    [IS_RESOLVED_ROUTE_SYMBOL]: true,
    id: route.id,
    status: route.status,
    name: route.name,
    matches: route.matches,
    hooks: getHooks(route),
    getRouteTitle,
    matched,
    query: createResolvedRouteQuery(query),
    state: getStateValues(route.state, options.state),
    hash,
    params,
    href,
    canonical,
    getTitle: () => getRouteTitle(resolvedRoute),
  }

  return resolvedRoute
}
