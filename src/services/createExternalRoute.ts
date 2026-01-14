import { markRaw } from 'vue'
import { createRouteId } from '@/services/createRouteId'
import { combineRoutes, CreateRouteOptions, isWithParent, ToRoute, WithHost, WithoutHost, WithoutParent, WithParent } from '@/types/createRouteOptions'
import { toName } from '@/types/name'
import { Route } from '@/types/route'
import { checkDuplicateParams } from '@/utilities/checkDuplicateParams'
import { toWithParams } from '@/services/withParams'
import { createRouteHooks } from '@/services/createRouteHooks'
import { createUrl } from '@/services/createUrl'
import { ExternalRouteHooks } from '@/types/hooks'
import { ExtractRouteContext } from '@/types/routeContext'
import { RouteRedirects } from '@/types/redirects'
import { createRouteRedirects } from './createRouteRedirects'

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
  const path = toWithParams(options.path)
  const query = toWithParams(options.query)
  const hash = toWithParams(options.hash)
  const meta = options.meta ?? {}
  const host = toWithParams(options.host)
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

  const route = {
    id,
    matched: rawRoute,
    matches: [rawRoute],
    hooks: [store],
    name,
    meta,
    depth: 1,
    state: {},
    context,
    ...hooks,
    ...redirects,
    ...url,
  } satisfies Route & ExternalRouteHooks & RouteRedirects

  const merged = isWithParent(options) ? combineRoutes(options.parent, route) : route

  checkDuplicateParams(merged.path.params, merged.query.params, merged.host.params, merged.hash.params)

  return merged
}
