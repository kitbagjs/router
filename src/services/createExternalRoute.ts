import { markRaw } from 'vue'
import { CombineHash } from '@/services/combineHash'
import { CombineMeta } from '@/services/combineMeta'
import { CombinePath } from '@/services/combinePath'
import { CombineQuery } from '@/services/combineQuery'
import { createRouteId } from '@/services/createRouteId'
import { combineRoutes, CreateRouteOptions, isWithHost, isWithParent, WithHost, WithoutHost, WithoutParent, WithParent } from '@/types/createRouteOptions'
import { toHash, ToHash } from '@/types/hash'
import { Host, toHost, ToHost } from '@/types/host'
import { toName, ToName } from '@/types/name'
import { toPath, ToPath } from '@/types/path'
import { toQuery, ToQuery } from '@/types/query'
import { CreatedRouteOptions, Route, ToMeta } from '@/types/route'
import { checkDuplicateParams } from '@/utilities/checkDuplicateKeys'

export function createExternalRoute<
  const THost extends string | Host,
  const TOptions extends CreateRouteOptions & WithHost<THost> & WithoutParent
>(options: TOptions):
Route<
  ToName<TOptions['name']>,
  ToHost<THost>,
  ToPath<TOptions['path']>,
  ToQuery<TOptions['query']>,
  ToHash<TOptions['hash']>,
  ToMeta<TOptions['meta']>,
  {},
  [CreatedRouteOptions & TOptions]
>

export function createExternalRoute<
  const TParent extends Route,
  const TOptions extends CreateRouteOptions & WithoutHost & WithParent<TParent>
>(options: TOptions):
Route<
  ToName<TOptions['name']>,
  Host<'', {}>,
  CombinePath<TParent['path'], ToPath<TOptions['path']>>,
  CombineQuery<TParent['query'], ToQuery<TOptions['query']>>,
  CombineHash<TParent['hash'], ToHash<TOptions['hash']>>,
  CombineMeta<ToMeta<TOptions['meta']>, TParent['meta']>,
  {},
  [CreatedRouteOptions & TOptions]
>

export function createExternalRoute(options: CreateRouteOptions): Route {
  const id = createRouteId()
  const name = toName(options.name)
  const path = toPath(options.path)
  const query = toQuery(options.query)
  const hash = toHash(options.hash)
  const meta = options.meta ?? {}
  const host = isWithHost(options) ? toHost(options.host) : toHost('')
  const rawRoute = markRaw({ id, meta: {}, state: {}, ...options })

  const route = {
    id,
    matched: rawRoute,
    matches: [rawRoute],
    name,
    host,
    path,
    query,
    hash,
    meta,
    depth: 1,
    state: {},
  }

  const merged = isWithParent(options) ? combineRoutes(options.parent, route) : route

  checkDuplicateParams(merged.path.params, merged.query.params, merged.host.params)

  return merged
}
