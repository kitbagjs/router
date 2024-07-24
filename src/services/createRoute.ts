import { markRaw } from 'vue'
import { RouterView } from '@/components'
import { CombineKey } from '@/services/combineKey'
import { CombinePath } from '@/services/combinePath'
import { CombineQuery } from '@/services/combineQuery'
import { host } from '@/services/host'
import { combineRoutes, CreateRouteOptions, isRouteWithParent, isRouteWithoutComponent, CreateRouteOptionsWithoutParent, CreateRouteOptionsWithParent } from '@/types/createRouteOptions'
import { Host } from '@/types/host'
import { ToKey, toKey } from '@/types/key'
import { Path, ToPath, toPath } from '@/types/path'
import { Query, ToQuery, toQuery } from '@/types/query'
import { Route } from '@/types/route'
import { checkDuplicateKeys } from '@/utilities/checkDuplicateKeys'

export function createRoute<
  TName extends string | undefined = undefined,
  TPath extends string | Path | undefined = undefined,
  TQuery extends string | Query | undefined = undefined
>(options: CreateRouteOptionsWithoutParent<TName, TPath, TQuery>): Route<ToKey<TName>, Host<'', {}>, ToPath<TPath>, ToQuery<TQuery>>

export function createRoute<
  TParent extends Route,
  TName extends string | undefined = undefined,
  TPath extends string | Path | undefined = undefined,
  TQuery extends string | Query | undefined = undefined
>(options: CreateRouteOptionsWithParent<TParent, TName, TPath, TQuery>): Route<CombineKey<TParent['key'], ToKey<TName>>, Host<'', {}>, CombinePath<TParent['path'], ToPath<TPath>>, CombineQuery<TParent['query'], ToQuery<TQuery>>>

export function createRoute(options: CreateRouteOptions | CreateRouteOptionsWithParent<Route>): Route {
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
    disabled: options.disabled ?? false,
    host: host('', {}),
  }

  const merged = isRouteWithParent(options) ? combineRoutes(options.parent, route) : route

  checkDuplicateKeys(merged.path.params, merged.query.params)

  return merged
}

function addRouterViewComponentIfWithoutComponent(options: CreateRouteOptions): CreateRouteOptions {
  if (isRouteWithoutComponent(options)) {
    return { ...options, component: RouterView }
  }

  return options
}