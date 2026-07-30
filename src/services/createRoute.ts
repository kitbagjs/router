import { markRaw } from 'vue'
import { createRouteId } from '@/services/createRouteId'
import { InternalRouteHooks } from '@/types/hooks'
import { RouteRedirects } from '@/types/redirects'
import { CreateRouteOptions, ToRouteMatches, ToRouteUrl, combineRoutes, isWithParent } from '@/types/createRouteOptions'
import { toName } from '@/types/name'
import { IS_ROUTE_SYMBOL, Route, RouteInternal } from '@/types/route'
import { createRouteHooks } from '@/services/createRouteHooks'
import { toUrlPart, toUrlQueryPart } from '@/services/withParams'
import { createUrl } from '@/services/createUrl'
import { createRouteRedirects } from '@/services/createRouteRedirects'
import { combineUrl } from '@/services/combineUrl'
import { createRouteTitle, RouteSetTitle } from '@/types/routeTitle'
import { RouteWithMethods } from '@/types/addView'
import { withAddView } from '@/services/addView'

export function createRoute<
  const TOptions extends CreateRouteOptions
>(options: TOptions): RouteWithMethods<ToRouteUrl<TOptions>, ToRouteMatches<TOptions>>

export function createRoute(options: CreateRouteOptions): Route {
  const id = createRouteId()
  const name = toName(options.name)
  const path = toUrlPart(options.path)
  const query = toUrlQueryPart(options.query)
  const hash = toUrlPart(options.hash)
  const meta = options.meta ?? {}
  const state = options.state ?? {}
  const context = options.context ?? []
  const { store, redirect, ...hooks } = createRouteHooks()
  const { setTitle, getTitle } = createRouteTitle(options.parent)
  const rawRoute = markRaw({ ...options, id, meta, state, name, views: {} })

  const redirects = createRouteRedirects({
    getRoute: () => route,
  })

  const url = createUrl({
    path,
    query,
    hash,
  })

  const internal = {
    [IS_ROUTE_SYMBOL]: true,
    depth: 1,
    hooks: [store],
    getTitle,
    redirect,
  } satisfies RouteInternal

  const route = {
    id,
    matches: [rawRoute],
    name,
    meta,
    state,
    context,
    prefetch: options.prefetch,
    setTitle,
    ...redirects,
    ...url,
    ...hooks,
    ...internal,
  } satisfies Route & RouteInternal & InternalRouteHooks & RouteRedirects & RouteSetTitle

  if (isWithParent(options)) {
    const merged = combineRoutes(options.parent, route)

    if (options.hoist) {
      return withAddView(merged)
    }

    const url = combineUrl(options.parent, {
      path,
      query,
      hash,
    })

    return withAddView({
      ...merged,
      ...url,
    })
  }

  return withAddView(route)
}
