import { markRaw } from 'vue'
import { CombinePath } from '@/services/combinePath'
import { CombineQuery } from '@/services/combineQuery'
import { combineRoutes, CreateRouteOptions, isWithHost, isWithParent, WithHost, WithoutHost, WithoutParent, WithParent } from '@/types/createRouteOptions'
import { Host, toHost, ToHost } from '@/types/host'
import { toName, ToName } from '@/types/name'
import { Path, toPath, ToPath } from '@/types/path'
import { Query, toQuery, ToQuery } from '@/types/query'
import { Route } from '@/types/route'
import { checkDuplicateParams } from '@/utilities/checkDuplicateKeys'

export function createExternalRoute<
  const THost extends string | Host,
  const TName extends string | undefined = undefined,
  const TPath extends string | Path | undefined = undefined,
  const TQuery extends string | Query | undefined = undefined
>(options: CreateRouteOptions<TName, TPath, TQuery> & WithHost<THost> & WithoutParent): Route<ToName<TName>, ToHost<THost>, ToPath<TPath>, ToQuery<TQuery>>

export function createExternalRoute<
  const TParent extends Route,
  const TName extends string | undefined = undefined,
  const TPath extends string | Path | undefined = undefined,
  const TQuery extends string | Query | undefined = undefined
>(options: CreateRouteOptions<TName, TPath, TQuery> & WithoutHost & WithParent<TParent>): Route<ToName<TName>, Host<'', {}>, CombinePath<TParent['path'], ToPath<TPath>>, CombineQuery<TParent['query'], ToQuery<TQuery>>>

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
  }

  const merged = isWithParent(options) ? combineRoutes(options.parent, route) : route

  checkDuplicateParams(merged.path.params, merged.query.params, merged.host.params)

  return merged
}