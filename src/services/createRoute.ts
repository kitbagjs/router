import { Component, markRaw } from 'vue'
import { CombineHash } from '@/services/combineHash'
import { CombineMeta } from '@/services/combineMeta'
import { CombinePath } from '@/services/combinePath'
import { CombineQuery } from '@/services/combineQuery'
import { CombineState } from '@/services/combineState'
import { createRouteId } from '@/services/createRouteId'
import { host } from '@/services/host'
import { CreateRouteOptions, WithComponent, WithComponents, WithParent, WithoutComponents, WithoutParent, combineRoutes, isWithParent } from '@/types/createRouteOptions'
import { toHash, ToHash } from '@/types/hash'
import { Host } from '@/types/host'
import { toName, ToName } from '@/types/name'
import { ToPath, toPath } from '@/types/path'
import { ToQuery, toQuery } from '@/types/query'
import { Route, ToMeta, ToState } from '@/types/route'
import { checkDuplicateParams } from '@/utilities/checkDuplicateKeys'

export function createRoute<
  const TOptions
>(options: TOptions & CreateRouteOptions & WithoutComponents & WithoutParent):
TOptions extends CreateRouteOptions
  ? Route<
    ToName<TOptions['name']>,
    Host<'', {}>,
    ToPath<TOptions['path']>,
    ToQuery<TOptions['query']>,
    ToHash<TOptions['hash']>,
    ToMeta<TOptions['meta']>,
    ToState<TOptions['state']>,
    [TOptions & { id: string }]
  >
  : Route<
    ToName<undefined>,
    Host<'', {}>,
    ToPath<undefined>,
    ToQuery<undefined>,
    ToHash<undefined>,
    ToMeta<undefined>,
    ToState<undefined>,
    [TOptions & { id: string }]
  >

export function createRoute<
  const TOptions,
  const TParent extends Route
>(options: TOptions & CreateRouteOptions & WithoutComponents & WithParent<TParent>):
TOptions extends CreateRouteOptions
  ? Route<
    ToName<TOptions['name']>,
    Host<'', {}>,
    CombinePath<TParent['path'], ToPath<TOptions['path']>>,
    CombineQuery<TParent['query'], ToQuery<TOptions['query']>>,
    CombineHash<TParent['hash'], ToHash<TOptions['hash']>>,
    CombineMeta<ToMeta<TOptions['meta']>, TParent['meta']>,
    CombineState<ToState<TOptions['state']>, TParent['state']>,
    [...TParent['matches'], TOptions & { id: string }]
  >
  : Route<
    TParent['name'],
    Host<'', {}>,
    TParent['path'],
    TParent['query'],
    TParent['hash'],
    TParent['meta'],
    TParent['state'],
    [TOptions & { id: string }]
  >

export function createRoute<
  const TOptions,
  TComponent extends Component
>(options: TOptions & CreateRouteOptions & WithoutParent & WithComponent<TComponent>):
TOptions extends CreateRouteOptions
  ? Route<
    ToName<TOptions['name']>,
    Host<'', {}>,
    ToPath<TOptions['path']>,
    ToQuery<TOptions['query']>,
    ToHash<TOptions['hash']>,
    ToMeta<TOptions['meta']>,
    ToState<TOptions['state']>,
    [TOptions & { id: string }]
  >
  : Route<
    ToName<undefined>,
    Host<'', {}>,
    ToPath<undefined>,
    ToQuery<undefined>,
    ToHash<undefined>,
    ToMeta<undefined>,
    ToState<undefined>,
    [TOptions & { id: string }]
  >

export function createRoute<
  const TOptions,
  const TParent extends Route,
  const TComponent extends Component
>(options: TOptions & CreateRouteOptions & WithComponent<TComponent> & WithParent<TParent>):
TOptions extends CreateRouteOptions
  ? Route<
    ToName<TOptions['name']>,
    Host<'', {}>,
    CombinePath<TParent['path'], ToPath<TOptions['path']>>,
    CombineQuery<TParent['query'], ToQuery<TOptions['query']>>,
    CombineHash<TParent['hash'], ToHash<TOptions['hash']>>,
    CombineMeta<ToMeta<TOptions['meta']>, TParent['meta']>,
    CombineState<ToState<TOptions['state']>, TParent['state']>,
    [...TParent['matches'], TOptions & { id: string }]
  >
  : Route<
    TParent['name'],
    Host<'', {}>,
    TParent['path'],
    TParent['query'],
    TParent['hash'],
    TParent['meta'],
    TParent['state'],
    [TOptions & { id: string }]
  >

export function createRoute<
  const TOptions,
  const TComponents extends Record<string, Component>
>(options: TOptions & CreateRouteOptions & WithComponents<TComponents> & WithoutParent):
TOptions extends CreateRouteOptions
  ? Route<
    ToName<TOptions['name']>,
    Host<'', {}>,
    ToPath<TOptions['path']>,
    ToQuery<TOptions['query']>,
    ToHash<TOptions['hash']>,
    ToMeta<TOptions['meta']>,
    ToState<TOptions['state']>,
    [TOptions & { id: string }]
  >
  : Route<
    ToName<undefined>,
    Host<'', {}>,
    ToPath<undefined>,
    ToQuery<undefined>,
    ToHash<undefined>,
    ToMeta<undefined>,
    ToState<undefined>,
    [TOptions & { id: string }]
  >

export function createRoute<
  const TOptions,
  const TParent extends Route,
  const TComponents extends Record<string, Component>
>(options: TOptions & CreateRouteOptions & WithComponents<TComponents> & WithParent<TParent>):
TOptions extends CreateRouteOptions
  ? Route<
    ToName<TOptions['name']>,
    Host<'', {}>,
    CombinePath<TParent['path'], ToPath<TOptions['path']>>,
    CombineQuery<TParent['query'], ToQuery<TOptions['query']>>,
    CombineHash<TParent['hash'], ToHash<TOptions['hash']>>,
    CombineMeta<ToMeta<TOptions['meta']>, TParent['meta']>,
    CombineState<ToState<TOptions['state']>, TParent['state']>,
    [...TParent['matches'], TOptions & { id: string }]
  >
  : Route<
    TParent['name'],
    Host<'', {}>,
    TParent['path'],
    TParent['query'],
    TParent['hash'],
    TParent['meta'],
    TParent['state'],
    [TOptions & { id: string }]
  >

export function createRoute(options: CreateRouteOptions): Route {
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
