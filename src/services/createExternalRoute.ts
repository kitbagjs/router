import { markRaw } from 'vue'
import { CombineKey } from '@/services/combineKey'
import { CombinePath } from '@/services/combinePath'
import { CombineQuery } from '@/services/combineQuery'
import { combineRoutes, CreateRouteOptions, isWithHost, isWithParent, WithHost, WithoutHost, WithoutParent, WithParent } from '@/types/createRouteOptions'
import { Host, toHost, ToHost } from '@/types/host'
import { ToKey, toKey } from '@/types/key'
import { Path, toPath, ToPath } from '@/types/path'
import { Query, toQuery, ToQuery } from '@/types/query'
import { Route } from '@/types/route'
import { checkDuplicateKeys } from '@/utilities/checkDuplicateKeys'

export function createExternalRoute<
  const THost extends string | Host,
  const TName extends string | undefined = undefined,
  const TPath extends string | Path | undefined = undefined,
  const TQuery extends string | Query | undefined = undefined
>(options: CreateRouteOptions<TName, TPath, TQuery> & WithHost<THost> & WithoutParent): Route<ToKey<TName>, ToHost<THost>, ToPath<TPath>, ToQuery<TQuery>>

export function createExternalRoute<
  const TParent extends Route,
  const TName extends string | undefined = undefined,
  const TPath extends string | Path | undefined = undefined,
  const TQuery extends string | Query | undefined = undefined
>(options: CreateRouteOptions<TName, TPath, TQuery> & WithoutHost & WithParent<TParent>): Route<CombineKey<TParent['key'], ToKey<TName>>, Host<'', {}>, CombinePath<TParent['path'], ToPath<TPath>>, CombineQuery<TParent['query'], ToQuery<TQuery>>>

export function createExternalRoute(options: CreateRouteOptions): Route {
  const key = toKey(options.name)
  const path = toPath(options.path)
  const query = toQuery(options.query)
  const host = isWithHost(options) ? toHost(options.host) : toHost('')
  const rawRoute = markRaw({ meta: {}, state: {}, ...options })

  const route = {
    matched: rawRoute,
    matches: [rawRoute],
    key,
    host,
    path,
    query,
    depth: 1,
    state: {},
  }

  const merged = isWithParent(options) ? combineRoutes(options.parent, route) : route

  checkDuplicateKeys(merged.path.params, merged.query.params, merged.host.params)

  return merged
}