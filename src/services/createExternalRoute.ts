import { markRaw } from 'vue'
import { createRouteId } from '@/services/createRouteId'
import { combineRoutes, CreateRouteOptions, isWithParent, ToRoute, WithHost, WithoutHost, WithoutParent, WithParent } from '@/types/createRouteOptions'
import { toName } from '@/types/name'
import { IS_ROUTE_SYMBOL, Route, RouteInternal } from '@/types/route'
import { toUrlPart, toUrlQueryPart } from '@/services/withParams'
import { createRouteHooks } from '@/services/createRouteHooks'
import { createUrl } from '@/services/createUrl'
import { createRouteRedirects } from '@/services/createRouteRedirects'
import { combineUrl } from '@/services/combineUrl'
import { ExternalRouteHooks, WithHooks } from '@/types/hooks'
import { ExtractRouteContext } from '@/types/routeContext'
import { RouteRedirects } from '@/types/redirects'

export function createExternalRoute<
  const TOptions extends CreateRouteOptions & WithHost & WithoutParent
>(options: TOptions): ToRoute<TOptions>
  & ExternalRouteHooks<ToRoute<TOptions>, TOptions['context']>
  & RouteRedirects<ToRoute<TOptions>>

export function createExternalRoute<
  const TOptions extends CreateRouteOptions & WithoutHost & WithParent
>(options: TOptions): ToRoute<TOptions>
  & ExternalRouteHooks<ToRoute<TOptions>, ExtractRouteContext<TOptions>>
  & RouteRedirects<ToRoute<TOptions>>

export function createExternalRoute(options: CreateRouteOptions & (WithoutHost | WithHost)): Route {
  const id = createRouteId()
  const name = toName(options.name)
  const path = toUrlPart(options.path)
  const query = toUrlQueryPart(options.query)
  const hash = toUrlPart(options.hash)
  const meta = options.meta ?? {}
  const host = toUrlPart(options.host)
  const context = options.context ?? []
  const { store, ...hooks } = createRouteHooks()
  const redirects = createRouteRedirects({
    getRoute: () => route,
  })
  const rawRoute = markRaw({ id, meta: {}, state: {}, ...options })

  const url = createUrl({
    host,
    path,
    query,
    hash,
  })

  const internal = {
    [IS_ROUTE_SYMBOL]: true,
    depth: 1,
  } satisfies RouteInternal

  const route = {
    id,
    matched: rawRoute,
    matches: [rawRoute],
    hooks: [store],
    name,
    meta,
    state: {},
    context,
    ...hooks,
    ...redirects,
    ...url,
    ...internal,
  } satisfies Route & RouteInternal & WithHooks & ExternalRouteHooks & RouteRedirects

  if (isWithParent(options)) {
    const merged = combineRoutes(options.parent, route)
    const url = combineUrl(options.parent, {
      path,
      query,
      hash,
    })

    return {
      ...merged,
      ...url,
    }
  }

  return route
}
