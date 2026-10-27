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
import { ExternalRouteHooks } from '@/types/hooks'
import { ExtractRouteContext } from '@/types/routeContext'
import { createRouteTitle, RouteSetTitle } from '@/types/routeTitle'

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
  const { getTitle, setTitle } = createRouteTitle(options.parent)
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
    getTitle,
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
    setTitle,
    ...hooks,
    ...url,
    ...internal,
  } satisfies Route & RouteInternal & ExternalRouteHooks & RouteSetTitle

  if (isWithParent(options)) {
    return withRouteMethods(combineRoutes(options.parent, route, options.hoist))
  }

  return withRouteMethods(route)
}
