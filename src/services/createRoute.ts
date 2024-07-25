import { Component, markRaw } from 'vue'
import { RouterView } from '@/components'
import { CombineKey } from '@/services/combineKey'
import { CombinePath } from '@/services/combinePath'
import { CombineQuery } from '@/services/combineQuery'
import { ComponentProps } from '@/services/component'
import { host } from '@/services/host'
import { combineRoutes, isRouteWithoutComponent } from '@/types/createRouteOptions'
import { Host } from '@/types/host'
import { ToKey, toKey } from '@/types/key'
import { Path, ToPath, toPath } from '@/types/path'
import { Query, ToQuery, toQuery } from '@/types/query'
import { RouteMeta } from '@/types/register'
import { Route } from '@/types/route'
import { MaybePromise } from '@/types/utilities'
import { checkDuplicateKeys } from '@/utilities/checkDuplicateKeys'

type CreateRouteOptions<
  TName extends string | undefined = undefined,
  TPath extends string | Path | undefined = undefined,
  TQuery extends string | Query | undefined = undefined
> = {
  name?: TName,
  path?: TPath,
  query?: TQuery,
  meta?: RouteMeta,
}

type RouteData<
  TComponent extends Component | undefined,
  TParams extends Record<string, unknown>
> = (params: TParams) => MaybePromise<TComponent extends Component ? ComponentProps<TComponent> | void : void>

type RouteDataRecord<
  TComponents extends Record<string, Component>,
  TParams extends Record<string, unknown>
> = {
  [TKey in keyof TComponents]: RouteData<TComponents[TKey], TParams>
}

type WithComponent<
  TComponent extends Component | undefined,
  TParams extends Record<string, unknown>
> = {
  component?: TComponent,
  data?: RouteData<TComponent, TParams>,
}

type WithComponents<
  TComponents extends Record<string, Component> | undefined,
  TParams extends Record<string, unknown>
> = {
  components?: TComponents,
  data?: TComponents extends Record<string, Component> ? RouteDataRecord<TComponents, TParams> : never,
}

type WithParent<TParent extends Route> = {
  parent: TParent,
}

export function isCreateRouteOptionsWithParent(options: CreateRouteOptions): options is CreateRouteOptions & WithParent<Route> {
  return 'parent' in options && Boolean(options.parent)
}

type WithoutParent = {
  parent?: never,
}

export function createRoute<
  const TName extends string | undefined = undefined,
  const TPath extends string | Path | undefined = undefined,
  const TQuery extends string | Query | undefined = undefined,
  const TComponent extends Component | undefined = undefined
>(options: CreateRouteOptions<TName, TPath, TQuery> & WithComponent<TComponent, {}> & WithoutParent): Route<ToKey<TName>, Host<'', {}>, ToPath<TPath>, ToQuery<TQuery>>

export function createRoute<
  const TName extends string | undefined = undefined,
  const TPath extends string | Path | undefined = undefined,
  const TQuery extends string | Query | undefined = undefined,
  const TComponents extends Record<string, Component> | undefined = undefined
>(options: CreateRouteOptions<TName, TPath, TQuery> & WithComponents<TComponents, {}> & WithoutParent): Route<ToKey<TName>, Host<'', {}>, ToPath<TPath>, ToQuery<TQuery>>


export function createRoute<
  const TParent extends Route,
  const TName extends string | undefined = undefined,
  const TPath extends string | Path | undefined = undefined,
  const TQuery extends string | Query | undefined = undefined,
  const TComponent extends Component | undefined = undefined
>(options: CreateRouteOptions<TName, TPath, TQuery> & WithComponent<TComponent, {}> & WithParent<TParent>): Route<CombineKey<TParent['key'], ToKey<TName>>, Host<'', {}>, CombinePath<TParent['path'], ToPath<TPath>>, CombineQuery<TParent['query'], ToQuery<TQuery>>>

export function createRoute<
  const TParent extends Route,
  const TName extends string | undefined = undefined,
  const TPath extends string | Path | undefined = undefined,
  const TQuery extends string | Query | undefined = undefined,
  const TComponents extends Record<string, Component> | undefined = undefined
>(options: CreateRouteOptions<TName, TPath, TQuery> & WithComponents<TComponents, {}> & WithParent<TParent>): Route<CombineKey<TParent['key'], ToKey<TName>>, Host<'', {}>, CombinePath<TParent['path'], ToPath<TPath>>, CombineQuery<TParent['query'], ToQuery<TQuery>>>

export function createRoute(options: CreateRouteOptions): Route {
  const routeWithComponent = addRouterViewComponentIfWithoutComponent(options)
  const key = toKey(options.name)
  const path = toPath(options.path)
  const query = toQuery(options.query)
  const rawRoute = markRaw({ meta: {}, ...routeWithComponent })

  const route = {
    matched: rawRoute,
    matches: [rawRoute],
    key,
    path,
    query,
    depth: 1,
    disabled: false,
    host: host('', {}),
  }

  const merged = isCreateRouteOptionsWithParent(options) ? combineRoutes(options.parent, route) : route

  checkDuplicateKeys(merged.path.params, merged.query.params)

  return merged
}

function addRouterViewComponentIfWithoutComponent(options: CreateRouteOptions): CreateRouteOptions & { component: Component } {
  if (isRouteWithoutComponent(options)) {
    return { ...options, component: RouterView }
  }

  return options
}