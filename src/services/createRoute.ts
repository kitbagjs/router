import { Component, markRaw } from 'vue'
import { CombineHash } from '@/services/combineHash'
import { CombineMeta } from '@/services/combineMeta'
import { CombinePath } from '@/services/combinePath'
import { CombineQuery } from '@/services/combineQuery'
import { CombineState } from '@/services/combineState'
import { createRouteId } from '@/services/createRouteId'
import { host } from '@/services/host'
import { CreateRouteOptions, WithComponent, WithComponents, WithParent, WithoutComponents, WithoutParent, combineRoutes, isWithParent, isWithState } from '@/types/createRouteOptions'
import { Hash, toHash, ToHash } from '@/types/hash'
import { Host } from '@/types/host'
import { toName, ToName } from '@/types/name'
import { Param } from '@/types/paramTypes'
import { Path, ToPath, toPath } from '@/types/path'
import { Query, ToQuery, toQuery } from '@/types/query'
import { RouteMeta } from '@/types/register'
import { Route, ToMeta, ToState } from '@/types/route'
import { checkDuplicateParams } from '@/utilities/checkDuplicateKeys'

export function createRoute<
  const TOptions extends CreateRouteOptions
>(options: TOptions
  & WithoutComponents
  & WithoutParent):
TOptions extends CreateRouteOptions<
  infer TName extends string | undefined,
  infer TPath extends Path | string | undefined,
  infer TQuery extends Query | string | undefined,
  infer THash extends Hash | string | undefined,
  infer TMeta extends RouteMeta,
  infer TState extends Record<string, Param>
> ? Route<ToName<TName>, Host<'', {}>, ToPath<TPath>, ToQuery<TQuery>, ToHash<THash>, ToMeta<TMeta>, ToState<TState>> : never

export function createRoute<
  const TParent extends Route,
  const TOptions extends CreateRouteOptions
>(options: TOptions
  & WithoutComponents
  & WithParent<TParent>):
TOptions extends CreateRouteOptions<
  infer TName extends string | undefined,
  infer TPath extends Path | string | undefined,
  infer TQuery extends Query | string | undefined,
  infer THash extends Hash | string | undefined,
  infer TMeta extends RouteMeta,
  infer TState extends Record<string, Param>
> ? Route<
    ToName<TName>,
    Host<'', {}>,
    CombinePath<TParent['path'], ToPath<TPath>>,
    CombineQuery<TParent['query'], ToQuery<TQuery>>,
    CombineHash<TParent['hash'], ToHash<THash>>,
    CombineMeta<ToMeta<TMeta>, TParent['meta']>,
    CombineState<ToState<TState>, TParent['state']>
  > : never

export function createRoute<
  const TComponent extends Component,
  const TOptions extends CreateRouteOptions
>(options: TOptions
  & WithComponent<TComponent>
  & WithoutParent):
TOptions extends CreateRouteOptions<
  infer TName extends string | undefined,
  infer TPath extends Path | string | undefined,
  infer TQuery extends Query | string | undefined,
  infer THash extends Hash | string | undefined,
  infer TMeta extends RouteMeta,
  infer TState extends Record<string, Param>
> ? Route<
    ToName<TName>,
    Host<'', {}>,
    ToPath<TPath>,
    ToQuery<TQuery>,
    ToHash<THash>,
    ToMeta<TMeta>,
    ToState<TState>
  > : never

export function createRoute<
  const TParent extends Route,
  const TComponent extends Component,
  const TOptions extends CreateRouteOptions
>(options: TOptions
  & WithComponent<TComponent>
  & WithParent<TParent>):
TOptions extends CreateRouteOptions<
  infer TName extends string | undefined,
  infer TPath extends Path | string | undefined,
  infer TQuery extends Query | string | undefined,
  infer THash extends Hash | string | undefined,
  infer TMeta extends RouteMeta,
  infer TState extends Record<string, Param>
> ? Route<
    ToName<TName>,
    Host<'', {}>,
    CombinePath<TParent['path'], ToPath<TPath>>,
    CombineQuery<TParent['query'], ToQuery<TQuery>>,
    CombineHash<TParent['hash'], ToHash<THash>>,
    CombineMeta<ToMeta<TMeta>, TParent['meta']>,
    CombineState<ToState<TState>, TParent['state']>
  > : never

export function createRoute<
  const TComponents extends Record<string, Component>,
  const TOptions extends CreateRouteOptions
>(options: TOptions
  & WithComponents<TComponents>
  & WithoutParent):
TOptions extends CreateRouteOptions<
  infer TName extends string | undefined,
  infer TPath extends Path | string | undefined,
  infer TQuery extends Query | string | undefined,
  infer THash extends Hash | string | undefined,
  infer TMeta extends RouteMeta,
  infer TState extends Record<string, Param>
> ? Route<
    ToName<TName>,
    Host<'', {}>,
    ToPath<TPath>,
    ToQuery<TQuery>,
    ToHash<THash>,
    ToMeta<TMeta>,
    ToState<TState>
  > : never

export function createRoute<
  const TParent extends Route,
  const TComponents extends Record<string, Component>,
  const TOptions extends CreateRouteOptions
>(options: TOptions
  & WithComponents<TComponents>
  & WithParent<TParent>):
TOptions extends CreateRouteOptions<
  infer TName extends string | undefined,
  infer TPath extends Path | string | undefined,
  infer TQuery extends Query | string | undefined,
  infer THash extends Hash | string | undefined,
  infer TMeta extends RouteMeta,
  infer TState extends Record<string, Param>
> ? Route<
    ToName<TName>,
    Host<'', {}>,
    CombinePath<TParent['path'], ToPath<TPath>>,
    CombineQuery<TParent['query'], ToQuery<TQuery>>,
    CombineHash<TParent['hash'], ToHash<THash>>,
    CombineMeta<ToMeta<TMeta>, TParent['meta']>,
    CombineState<ToState<TState>, TParent['state']>
  > : never

export function createRoute(options: CreateRouteOptions): Route {
  const id = createRouteId()
  const name = toName(options.name)
  const path = toPath(options.path)
  const query = toQuery(options.query)
  const hash = toHash(options.hash)
  const meta = options.meta ?? {}
  const state = isWithState(options) ? options.state : {}
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
