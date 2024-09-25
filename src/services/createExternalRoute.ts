import { markRaw } from 'vue'
import { CombineHash } from '@/services/combineHash'
import { CombineMeta } from '@/services/combineMeta'
import { CombinePath } from '@/services/combinePath'
import { CombineQuery } from '@/services/combineQuery'
import { combineRoutes, CreateRouteOptions, isWithHost, isWithParent, WithHost, WithoutHost, WithoutParent, WithParent } from '@/types/createRouteOptions'
import { Host, toHost, ToHost } from '@/types/host'
import { toName, ToName } from '@/types/name'
import { Path, toPath, ToPath } from '@/types/path'
import { Query, toQuery, ToQuery } from '@/types/query'
import { RouteMeta } from '@/types/register'
import { Route } from '@/types/route'
import { checkDuplicateParams } from '@/utilities/checkDuplicateKeys'

export function createExternalRoute<
  const THost extends string | Host,
  const TName extends string | undefined = undefined,
  const TPath extends string | Path | undefined = undefined,
  const TQuery extends string | Query | undefined = undefined,
  const TMeta extends RouteMeta = RouteMeta,
  const THash extends string | undefined = string | undefined
>(options: CreateRouteOptions<TName, TPath, TQuery> & WithHost<THost> & WithoutParent):
Route<ToName<TName>, ToHost<THost>, ToPath<TPath>, ToQuery<TQuery>, TMeta, THash>

export function createExternalRoute<
  const TParent extends Route,
  const TName extends string | undefined = undefined,
  const TPath extends string | Path | undefined = undefined,
  const TQuery extends string | Query | undefined = undefined,
  const TMeta extends RouteMeta = RouteMeta,
  const THash extends string | undefined = string | undefined
>(options: CreateRouteOptions<TName, TPath, TQuery> & WithoutHost & WithParent<TParent>):
Route<ToName<TName>, Host<'', {}>, CombinePath<TParent['path'], ToPath<TPath>>, CombineQuery<TParent['query'], ToQuery<TQuery>>, CombineMeta<TMeta, TParent['meta']>, CombineHash<TParent['hash'], THash>>

export function createExternalRoute(options: CreateRouteOptions): Route {
  const name = toName(options.name)
  const path = toPath(options.path)
  const query = toQuery(options.query)
  const meta = options.meta ?? {}
  const host = isWithHost(options) ? toHost(options.host) : toHost('')
  const rawRoute = markRaw({ meta: {}, state: {}, ...options })

  const route = {
    matched: rawRoute,
    matches: [rawRoute],
    name,
    host,
    path,
    query,
    meta,
    depth: 1,
    state: {},
    hash: options.hash,
  }

  const merged = isWithParent(options) ? combineRoutes(options.parent, route) : route

  checkDuplicateParams(merged.path.params, merged.query.params, merged.host.params)

  return merged
}