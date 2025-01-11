import { Component, markRaw } from 'vue'
import { CombineHash } from '@/services/combineHash'
import { CombineMeta } from '@/services/combineMeta'
import { CombinePath } from '@/services/combinePath'
import { CombineQuery } from '@/services/combineQuery'
import { CombineState } from '@/services/combineState'
import { createRouteId } from '@/services/createRouteId'
import { host } from '@/services/host'
import { CreateRouteOptions, ComponentContext, WithParent, WithoutParent, combineRoutes, isWithParent } from '@/types/createRouteOptions'
import { toHash, ToHash } from '@/types/hash'
import { Host } from '@/types/host'
import { toName, ToName } from '@/types/name'
import { ToPath, toPath } from '@/types/path'
import { ToQuery, toQuery } from '@/types/query'
import { CreatedRouteOptions, Route, ToMeta, ToState } from '@/types/route'
import { checkDuplicateParams } from '@/utilities/checkDuplicateKeys'

export function createRoute<
  const TOptions extends CreateRouteOptions,
  const TComponentContext extends Component | ComponentContext<TOptions> | ComponentContext<TOptions>[]
>(options: TOptions & WithoutParent, componentContext?: TComponentContext):
Route<
  ToName<TOptions['name']>,
  Host<'', {}>,
  ToPath<TOptions['path']>,
  ToQuery<TOptions['query']>,
  ToHash<TOptions['hash']>,
  ToMeta<TOptions['meta']>,
  ToState<TOptions['state']>,
  [CreatedRouteOptions<TOptions, TComponentContext>]
>

export function createRoute<
  const TParent extends Route,
  const TOptions extends CreateRouteOptions,
  const TComponentContext extends Component | ComponentContext<TOptions> | ComponentContext<TOptions>[]
>(options: TOptions & WithParent<TParent>, componentContext?: TComponentContext):
Route<
  ToName<TOptions['name']>,
  Host<'', {}>,
  CombinePath<TParent['path'], ToPath<TOptions['path']>>,
  CombineQuery<TParent['query'], ToQuery<TOptions['query']>>,
  CombineHash<TParent['hash'], ToHash<TOptions['hash']>>,
  CombineMeta<ToMeta<TOptions['meta']>, TParent['meta']>,
  CombineState<ToState<TOptions['state']>, TParent['state']>,
  [...TParent['matches'], CreatedRouteOptions<TOptions, TComponentContext>]
>

export function createRoute(options: CreateRouteOptions, componentContext?: Component | ComponentContext | ComponentContext[]): Route {
  const id = createRouteId()
  const name = toName(options.name)
  const path = toPath(options.path)
  const query = toQuery(options.query)
  const hash = toHash(options.hash)
  const meta = options.meta ?? {}
  const state = options.state ?? {}
  const rawRoute = markRaw({ id, meta: {}, state: {}, ...options })

  const route = {
    id,
    matched: rawRoute,
    matches: [rawRoute],
    name,
    path,
    query,
    hash,
    meta,
    state,
    depth: 1,
    host: host('', {}),
    prefetch: options.prefetch,
  } satisfies Route

  const merged = isWithParent(options) ? combineRoutes(options.parent, route) : route

  checkDuplicateParams(merged.path.params, merged.query.params)

  return merged
}
