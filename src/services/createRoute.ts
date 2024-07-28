import { Component, markRaw } from 'vue'
import { CombineKey } from '@/services/combineKey'
import { CombinePath } from '@/services/combinePath'
import { CombineQuery } from '@/services/combineQuery'
import { host } from '@/services/host'
import { CreateRouteOptions, WithComponent, WithComponents, WithHooks, WithParent, WithoutParent, combineRoutes, isWithParent } from '@/types/createRouteOptions'
import { Host } from '@/types/host'
import { ToKey, toKey } from '@/types/key'
import { Path, ToPath, toPath } from '@/types/path'
import { Query, ToQuery, toQuery } from '@/types/query'
import { RouteMeta } from '@/types/register'
import { Route } from '@/types/route'
import { checkDuplicateKeys } from '@/utilities/checkDuplicateKeys'

export function createRoute<
  const TName extends string | undefined = undefined,
  const TPath extends string | Path | undefined = undefined,
  const TQuery extends string | Query | undefined = undefined,
  const TMeta extends RouteMeta = RouteMeta,
  TComponent extends Component | undefined = undefined
>(options: CreateRouteOptions<TName, TPath, TQuery, TMeta> & WithHooks & WithComponent<TComponent> & WithoutParent): Route<ToKey<TName>, Host<'', {}>, ToPath<TPath>, ToQuery<TQuery>, TMeta>

export function createRoute<
  const TName extends string | undefined = undefined,
  const TPath extends string | Path | undefined = undefined,
  const TQuery extends string | Query | undefined = undefined,
  const TMeta extends RouteMeta = RouteMeta,
  TComponents extends Record<string, Component> | undefined = undefined
>(options: CreateRouteOptions<TName, TPath, TQuery, TMeta> & WithHooks & WithComponents<TComponents> & WithoutParent): Route<ToKey<TName>, Host<'', {}>, ToPath<TPath>, ToQuery<TQuery>, TMeta>

export function createRoute<
  const TParent extends Route,
  const TName extends string | undefined = undefined,
  const TPath extends string | Path | undefined = undefined,
  const TQuery extends string | Query | undefined = undefined,
  const TMeta extends RouteMeta = RouteMeta,
  TComponent extends Component | undefined = undefined
>(options: CreateRouteOptions<TName, TPath, TQuery, TMeta> & WithHooks & WithComponent<TComponent> & WithParent<TParent>): Route<CombineKey<TParent['key'], ToKey<TName>>, Host<'', {}>, CombinePath<TParent['path'], ToPath<TPath>>, CombineQuery<TParent['query'], ToQuery<TQuery>>, TMeta>

export function createRoute<
  const TParent extends Route,
  const TName extends string | undefined = undefined,
  const TPath extends string | Path | undefined = undefined,
  const TQuery extends string | Query | undefined = undefined,
  const TMeta extends RouteMeta = RouteMeta,
  TComponents extends Record<string, Component> | undefined = undefined
>(options: CreateRouteOptions<TName, TPath, TQuery, TMeta> & WithHooks & WithComponents<TComponents> & WithParent<TParent>): Route<CombineKey<TParent['key'], ToKey<TName>>, Host<'', {}>, CombinePath<TParent['path'], ToPath<TPath>>, CombineQuery<TParent['query'], ToQuery<TQuery>>, TMeta>

export function createRoute(options: CreateRouteOptions): Route {
  const key = toKey(options.name)
  const path = toPath(options.path)
  const query = toQuery(options.query)
  const rawRoute = markRaw({ meta: {}, ...options })

  const route = {
    matched: rawRoute,
    matches: [rawRoute],
    key,
    path,
    query,
    depth: 1,
    host: host('', {}),
  }

  const merged = isWithParent(options) ? combineRoutes(options.parent, route) : route

  checkDuplicateKeys(merged.path.params, merged.query.params)

  return merged
}