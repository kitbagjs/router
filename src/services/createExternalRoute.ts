import { markRaw } from 'vue'
import { CombineHash } from '@/services/combineHash'
import { CombineMeta } from '@/services/combineMeta'
import { CombinePath } from '@/services/combinePath'
import { CombineQuery } from '@/services/combineQuery'
import { createRouteId } from '@/services/createRouteId'
import { combineRoutes, CreateRouteOptions, isWithHost, isWithParent, WithHost, WithoutHost, WithoutParent, WithParent } from '@/types/createRouteOptions'
import { Hash, toHash, ToHash } from '@/types/hash'
import { toName, ToName } from '@/types/name'
import { RouteMeta } from '@/types/register'
import { Route } from '@/types/route'
import { checkDuplicateParams } from '@/utilities/checkDuplicateKeys'
import { EmptyWithParams, toWithParams, ToWithParams, WithParams } from '@/services/withParams'

export function createExternalRoute<
  const THost extends string | WithParams,
  const TName extends string | undefined = undefined,
  const TPath extends string | WithParams | undefined = undefined,
  const TQuery extends string | WithParams | undefined = undefined,
  const THash extends string | Hash | undefined = undefined,
  const TMeta extends RouteMeta = RouteMeta
>(options: CreateRouteOptions<TName, TPath, TQuery> & WithHost<THost> & WithoutParent):
Route<ToName<TName>, ToWithParams<THost>, ToWithParams<TPath>, ToWithParams<TQuery>, ToHash<THash>, TMeta>

export function createExternalRoute<
  const TParent extends Route,
  const TName extends string | undefined = undefined,
  const TPath extends string | WithParams | undefined = undefined,
  const TQuery extends string | WithParams | undefined = undefined,
  const THash extends string | Hash | undefined = undefined,
  const TMeta extends RouteMeta = RouteMeta
>(options: CreateRouteOptions<TName, TPath, TQuery> & WithoutHost & WithParent<TParent>):
Route<ToName<TName>, EmptyWithParams, CombinePath<TParent['path'], ToWithParams<TPath>>, CombineQuery<TParent['query'], ToWithParams<TQuery>>, CombineHash<TParent['hash'], ToHash<THash>>, CombineMeta<TMeta, TParent['meta']>>

export function createExternalRoute(options: CreateRouteOptions): Route {
  const id = createRouteId()
  const name = toName(options.name)
  const path = toWithParams(options.path)
  const query = toWithParams(options.query)
  const hash = toHash(options.hash)
  const meta = options.meta ?? {}
  const host = isWithHost(options) ? toWithParams(options.host) : toWithParams('')
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
