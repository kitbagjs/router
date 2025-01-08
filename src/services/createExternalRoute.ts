import { markRaw } from 'vue'
import { CombineHash } from '@/services/combineHash'
import { CombineMeta } from '@/services/combineMeta'
import { CombinePath } from '@/services/combinePath'
import { CombineQuery } from '@/services/combineQuery'
import { createRouteId } from '@/services/createRouteId'
import { combineRoutes, CreateRouteOptions, isWithHost, isWithParent, WithHost, WithoutHost, WithoutParent, WithParent } from '@/types/createRouteOptions'
import { Hash, toHash, ToHash } from '@/types/hash'
import { Host, toHost, ToHost } from '@/types/host'
import { toName, ToName } from '@/types/name'
import { Path, toPath, ToPath } from '@/types/path'
import { Query, toQuery, ToQuery } from '@/types/query'
import { RouteMeta } from '@/types/register'
import { CreatedRouteOptions, Route } from '@/types/route'
import { checkDuplicateParams } from '@/utilities/checkDuplicateKeys'

export function createExternalRoute<
  const THost extends string | Host,
  const TOptions extends CreateRouteOptions
>(options: TOptions & WithHost<THost> & WithoutParent):
TOptions extends CreateRouteOptions<
  infer TName extends string | undefined,
  infer TPath extends string | Path | undefined,
  infer TQuery extends string | Query | undefined,
  infer THash extends string | Hash | undefined,
  infer TMeta extends RouteMeta
> ? Route<
    ToName<TName>,
    ToHost<THost>,
    ToPath<TPath>,
    ToQuery<TQuery>,
    ToHash<THash>,
    TMeta,
    {},
    [CreatedRouteOptions & TOptions]
  > : never

export function createExternalRoute<
  const TParent extends Route,
  const TOptions extends CreateRouteOptions
>(options: TOptions & WithoutHost & WithParent<TParent>):
TOptions extends CreateRouteOptions<
  infer TName extends string | undefined,
  infer TPath extends string | Path | undefined,
  infer TQuery extends string | Query | undefined,
  infer THash extends string | Hash | undefined,
  infer TMeta extends RouteMeta
> ? Route<
    ToName<TName>,
    Host<'', {}>,
    CombinePath<TParent['path'], ToPath<TPath>>,
    CombineQuery<TParent['query'], ToQuery<TQuery>>,
    CombineHash<TParent['hash'], ToHash<THash>>,
    CombineMeta<TMeta, TParent['meta']>,
    {},
    [CreatedRouteOptions & TOptions]
  > : never

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
