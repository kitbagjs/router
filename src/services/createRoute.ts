import { markRaw } from 'vue'
import { createRouteId } from '@/services/createRouteId'
import { InternalRouteHooks } from '@/types/hooks'
import { CreateRouteOptions, ToRouteMatches, ToRouteUrl, combineRoutes, isWithParent } from '@/types/createRouteOptions'
import { toName } from '@/types/name'
import { IS_ROUTE_SYMBOL, Route, RouteInternal } from '@/types/route'
import { createRouteHooks } from '@/services/createRouteHooks'
import { toUrlPart, toUrlQueryPart } from '@/services/withParams'
import { createUrl } from '@/services/createUrl'
import { createRouteTitle, RouteSetTitle } from '@/types/routeTitle'
import { RouteWithMethods } from '@/types/routeWithMethods'
import { withRouteMethods } from '@/services/withRouteMethods'

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
  const rawRoute = markRaw({ ...options, id, meta, state, name, views: {}, loaders: {} })

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
    aliases: [],
  } satisfies Omit<RouteInternal, 'getContext'>

  const route = {
    id,
    matches: [rawRoute],
    name,
    meta,
    state,
    context,
    prefetch: options.prefetch,
    setTitle,
    ...url,
    ...hooks,
    ...internal,
  } satisfies Route & Omit<RouteInternal, 'getContext'> & InternalRouteHooks & RouteSetTitle

  if (isWithParent(options)) {
    const combined = combineRoutes(options.parent, route, options.hoist)

    return withRouteMethods(combined)
  }

  return withRouteMethods(route)
}
