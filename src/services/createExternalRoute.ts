import { markRaw } from 'vue'
import { CombineKey } from '@/services/combineKey'
import { CombinePath } from '@/services/combinePath'
import { CombineQuery } from '@/services/combineQuery'
import { combineRoutes, CreateRouteOptions, CreateRouteOptionsWithoutParent, CreateRouteOptionsWithParent, isRouteWithParent } from '@/types/createRouteOptions'
import { Host, toHost, ToHost } from '@/types/host'
import { ToKey, toKey } from '@/types/key'
import { Path, toPath, ToPath } from '@/types/path'
import { Query, toQuery, ToQuery } from '@/types/query'
import { Route } from '@/types/route'
import { checkDuplicateKeys } from '@/utilities/checkDuplicateKeys'

export function createExternalRoute<
  const TName extends string | undefined = undefined,
  const TPath extends string | Path | undefined = undefined,
  const TQuery extends string | Query | undefined = undefined,
  const THost extends string | Host | undefined = undefined
>(options: CreateRouteOptionsWithoutParent<TName, TPath, TQuery, THost>): Route<ToKey<TName>, ToHost<THost>, ToPath<TPath>, ToQuery<TQuery>>

export function createExternalRoute<
  const TParent extends Route,
  const TName extends string | undefined = undefined,
  const TPath extends string | Path | undefined = undefined,
  const TQuery extends string | Query | undefined = undefined
>(options: CreateRouteOptionsWithParent<TParent, TName, TPath, TQuery, Host<'', {}>>): Route<CombineKey<TParent['key'], ToKey<TName>>, ToHost<Host<'', {}>>, CombinePath<TParent['path'], ToPath<TPath>>, CombineQuery<TParent['query'], ToQuery<TQuery>>>

export function createExternalRoute(options: CreateRouteOptions | CreateRouteOptionsWithParent<Route>): Route {
  const key = toKey(options.name)
  const path = toPath(options.path)
  const query = toQuery(options.query)
  const host = toHost(options.host ?? '')
  const rawRoute = markRaw({ meta: {}, ...options })

  const route = {
    matched: rawRoute,
    matches: [rawRoute],
    key,
    host,
    path,
    query,
    depth: 1,
  }

  const merged = isRouteWithParent(options) ? combineRoutes(options.parent, route) : route

  checkDuplicateKeys(merged.path.params, merged.query.params, merged.host.params)

  return merged
}