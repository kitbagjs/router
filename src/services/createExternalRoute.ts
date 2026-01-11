import { markRaw } from 'vue'
import { createRouteId } from '@/services/createRouteId'
import { combineRoutes, CreateRouteOptions, isWithParent, ToRoute, WithHost, WithoutHost, WithoutParent, WithParent } from '@/types/createRouteOptions'
import { toName } from '@/types/name'
import { Route } from '@/types/route'
import { checkDuplicateParams } from '@/utilities/checkDuplicateKeys'
import { toWithParams } from '@/services/withParams'
import { createRouteHooks } from '@/services/createRouteHooks'
import { ExternalRouteHooks } from '@/types/hooks'
import { ExtractRouteContext } from '@/types/routeContext'

export function createExternalRoute<
  const TOptions extends CreateRouteOptions & WithHost & WithoutParent
>(options: TOptions): ToRoute<TOptions>
  & ExternalRouteHooks<ToRoute<TOptions>, TOptions['context']>

export function createExternalRoute<
  const TOptions extends CreateRouteOptions & WithoutHost & WithParent
>(options: TOptions): ToRoute<TOptions>
  & ExternalRouteHooks<ToRoute<TOptions>, ExtractRouteContext<TOptions>>

export function createExternalRoute(options: CreateRouteOptions & (WithoutHost | WithHost)): Route {
  const id = createRouteId()
  const name = toName(options.name)
  const path = toWithParams(options.path)
  const query = toWithParams(options.query)
  const hash = toWithParams(options.hash)
  const meta = options.meta ?? {}
  const host = toWithParams(options.host)
  const context = options.context ?? []
  const { store, onBeforeRouteEnter } = createRouteHooks()
  const rawRoute = markRaw({ id, meta: {}, state: {}, ...options })

  const route = {
    id,
    matched: rawRoute,
    matches: [rawRoute],
    hooks: [store],
    name,
    host,
    path,
    query,
    hash,
    meta,
    depth: 1,
    state: {},
    context,
    onBeforeRouteEnter,
  } satisfies Route & ExternalRouteHooks

  const merged = isWithParent(options) ? combineRoutes(options.parent, route) : route

  checkDuplicateParams(merged.path.params, merged.query.params, merged.host.params, merged.hash.params)

  return merged
}
