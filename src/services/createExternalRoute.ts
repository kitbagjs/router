import { markRaw } from 'vue'
import { createRouteId } from '@/services/createRouteId'
import { combineRoutes, CreateRouteOptions, isWithParent, ToRoute, WithHost, WithoutHost, WithoutParent, WithParent } from '@/types/createRouteOptions'
import { toName } from '@/types/name'
import { Route } from '@/types/route'
import { checkDuplicateParams } from '@/utilities/checkDuplicateParams'
import { toWithParams } from '@/services/withParams'
import { createHooksFactory } from '@/services/createHooksFactory'
import { createUrl } from '@/services/createUrl'
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
  const { store, onBeforeRouteEnter } = createHooksFactory()
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
    ...url,
    onBeforeRouteEnter,
  } satisfies Route & ExternalRouteHooks

  const merged = isWithParent(options) ? combineRoutes(options.parent, route) : route

  checkDuplicateParams(merged.path.schema.params, merged.query.schema.params, merged.host.schema.params, merged.hash.schema.params)

  return merged
}
