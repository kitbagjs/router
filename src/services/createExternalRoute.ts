import { withRouteMethods } from '@/services/withRouteMethods'
import { ExternalRouteWithMethods } from '@/types/routeWithMethods'
import { markRaw } from 'vue'
import { createRouteId } from '@/services/createRouteId'
import { combineRoutes, CreateRouteOptions, isWithParent, ToRoute, WithHost, WithoutHost, WithoutParent, WithParent } from '@/types/createRouteOptions'
import { toName } from '@/types/name'
import { IS_ROUTE_SYMBOL, Route, RouteInternal } from '@/types/route'
import { toUrlPart, toUrlQueryPart } from '@/services/withParams'
import { createRouteHooks } from '@/services/createRouteHooks'
import { createUrl } from '@/services/createUrl'
import { ExtractRouteContext } from '@/types/routeContext'

export function createExternalRoute<
  const TOptions extends CreateRouteOptions & WithHost & WithoutParent
>(options: TOptions): ExternalRouteWithMethods<ToRoute<TOptions>, TOptions['context']>

export function createExternalRoute<
  const TOptions extends CreateRouteOptions & WithoutHost & WithParent
>(options: TOptions): ExternalRouteWithMethods<ToRoute<TOptions>, ExtractRouteContext<TOptions>>

export function createExternalRoute(options: CreateRouteOptions & (WithoutHost | WithHost)): Route {
  const id = createRouteId()
  const name = toName(options.name)
  const path = toUrlPart(options.path)
  const query = toUrlQueryPart(options.query)
  const hash = toUrlPart(options.hash)
  const meta = options.meta ?? {}
  const host = toUrlPart(options.host)
  const context = options.context ?? []
  const { store, redirect, ...hooks } = createRouteHooks()
  const rawRoute = markRaw({ id, meta: {}, state: {}, ...options, views: {}, loaders: {} })

  const url = createUrl({
    host,
    path,
    query,
    hash,
  })

  const internal = {
    [IS_ROUTE_SYMBOL]: true,
    depth: 1,
    hooks: [store],
    redirect,
    aliases: [],
  } satisfies RouteInternal

  const route = {
    id,
    matches: [rawRoute],
    name,
    meta,
    state: {},
    context,
    ...url,
    ...internal,
  } satisfies Route & RouteInternal

  if (isWithParent(options)) {
    return withRouteMethods(combineRoutes(options.parent, route, options.hoist), hooks)
  }

  return withRouteMethods(route, hooks)
}
