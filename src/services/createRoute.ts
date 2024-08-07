import { Component, markRaw } from 'vue'
import { CombineKey } from '@/services/combineKey'
import { CombinePath } from '@/services/combinePath'
import { CombineQuery } from '@/services/combineQuery'
import { host } from '@/services/host'
import { CreateRouteOptions, WithComponent, WithComponents, WithHooks, WithParent, WithoutComponents, WithoutParent, combineRoutes, isWithParent } from '@/types/createRouteOptions'
import { Host } from '@/types/host'
import { ToKey, toKey } from '@/types/key'
import { ExtractParamTypes } from '@/types/params'
import { Path, ToPath, toPath } from '@/types/path'
import { Query, ToQuery, toQuery } from '@/types/query'
import { RouteMeta } from '@/types/register'
import { Route } from '@/types/route'
import { Identity } from '@/types/utilities'
import { checkDuplicateKeys } from '@/utilities/checkDuplicateKeys'

type ParentPath<TParent extends Route | undefined> = TParent extends Route ? TParent['path'] : Path<'', {}>
type ParentQuery<TParent extends Route | undefined> = TParent extends Route ? TParent['query'] : Query<'', {}>

type RouteParams<
  TPath extends string | Path | undefined,
  TQuery extends string | Query | undefined,
  TParent extends Route | undefined = undefined
> = ExtractParamTypes<Identity<CombinePath<ParentPath<TParent>, ToPath<TPath>>['params'] & CombineQuery<ParentQuery<TParent>, ToQuery<TQuery>>['params']>>

export function createRoute<
  const TName extends string | undefined = undefined,
  const TPath extends string | Path | undefined = undefined,
  const TQuery extends string | Query | undefined = undefined,
  const TMeta extends RouteMeta = RouteMeta
>(options: CreateRouteOptions<TName, TPath, TQuery, TMeta> & WithHooks & WithoutComponents & WithoutParent): Route<ToKey<TName>, Host<'', {}>, ToPath<TPath>, ToQuery<TQuery>>

export function createRoute<
  const TParent extends Route,
  const TName extends string | undefined = undefined,
  const TPath extends string | Path | undefined = undefined,
  const TQuery extends string | Query | undefined = undefined,
  const TMeta extends RouteMeta = RouteMeta
>(options: CreateRouteOptions<TName, TPath, TQuery, TMeta> & WithHooks & WithoutComponents & WithParent<TParent>): Route<CombineKey<TParent['key'], ToKey<TName>>, Host<'', {}>, CombinePath<TParent['path'], ToPath<TPath>>, CombineQuery<TParent['query'], ToQuery<TQuery>>>

export function createRoute<
  TComponent extends Component,
  const TName extends string | undefined = undefined,
  const TPath extends string | Path | undefined = undefined,
  const TQuery extends string | Query | undefined = undefined,
  const TMeta extends RouteMeta = RouteMeta
>(options: CreateRouteOptions<TName, TPath, TQuery, TMeta> & WithHooks & WithComponent<TComponent, RouteParams<TPath, TQuery>> & WithoutParent): Route<ToKey<TName>, Host<'', {}>, ToPath<TPath>, ToQuery<TQuery>>

export function createRoute<
  TComponent extends Component,
  const TParent extends Route,
  const TName extends string | undefined = undefined,
  const TPath extends string | Path | undefined = undefined,
  const TQuery extends string | Query | undefined = undefined,
  const TMeta extends RouteMeta = RouteMeta
>(options: CreateRouteOptions<TName, TPath, TQuery, TMeta> & WithHooks & WithComponent<TComponent, RouteParams<TPath, TQuery, TParent>> & WithParent<TParent>): Route<CombineKey<TParent['key'], ToKey<TName>>, Host<'', {}>, CombinePath<TParent['path'], ToPath<TPath>>, CombineQuery<TParent['query'], ToQuery<TQuery>>>

export function createRoute<
  TComponents extends Record<string, Component>,
  const TName extends string | undefined = undefined,
  const TPath extends string | Path | undefined = undefined,
  const TQuery extends string | Query | undefined = undefined,
  const TMeta extends RouteMeta = RouteMeta
>(options: CreateRouteOptions<TName, TPath, TQuery, TMeta> & WithHooks & WithComponents<TComponents, RouteParams<TPath, TQuery>> & WithoutParent): Route<ToKey<TName>, Host<'', {}>, ToPath<TPath>, ToQuery<TQuery>>

export function createRoute<
  TComponents extends Record<string, Component>,
  const TParent extends Route,
  const TName extends string | undefined = undefined,
  const TPath extends string | Path | undefined = undefined,
  const TQuery extends string | Query | undefined = undefined,
  const TMeta extends RouteMeta = RouteMeta
>(options: CreateRouteOptions<TName, TPath, TQuery, TMeta> & WithHooks & WithComponents<TComponents, RouteParams<TPath, TQuery, TParent>> & WithParent<TParent>): Route<CombineKey<TParent['key'], ToKey<TName>>, Host<'', {}>, CombinePath<TParent['path'], ToPath<TPath>>, CombineQuery<TParent['query'], ToQuery<TQuery>>>

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