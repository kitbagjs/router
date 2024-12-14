import { ResolvedRoute } from "@/types/resolved"
import { Route } from "@/types/route"
import { parseUrl } from "@/services/urlParser"
import { assembleUrl } from "@/services/urlAssembly"
import { RouterResolveOptions } from "@/types/RouterResolve"
import { createResolvedRouteQuery } from "@/services/createResolvedRouteQuery"
import { getRouteParamValues } from "@/services/paramValidation"
import { getStateValues } from "@/services/state"
import { asUrl } from "@/types/url"

export function createResolvedRoute(route: Route, url: string, options?: RouterResolveOptions): ResolvedRoute | undefined
export function createResolvedRoute(route: Route, params?: Record<string, unknown>, options?: RouterResolveOptions): ResolvedRoute | undefined
export function createResolvedRoute(route: Route, urlOrParams?: string | Record<string, unknown>, options: RouterResolveOptions = {}): ResolvedRoute | undefined {
  const href = typeof urlOrParams === 'string' ? asUrl(urlOrParams) : assembleUrl(route, {
    params: urlOrParams,
    query: options.query,
    hash: options.hash,
  })

  const { search, hash } = parseUrl(href)

  return {
    id: route.id,
    matched: route.matched,
    matches: route.matches,
    name: route.name,
    query: createResolvedRouteQuery(search),
    params: getRouteParamValues(route, href),
    state: getStateValues(route.state, options.state),
    hash,
    href
  }
}
