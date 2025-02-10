import { Routes } from '@/types/route'
import { RoutesName } from '@/types/routesMap'
import { withParams } from '@/services/withParams'
import { RouteParamsByKey } from '@/types/routeWithParams'
import { AllPropertiesAreOptional } from '@/types/utilities'
import { QuerySource } from '@/types/querySource'
import { ResolvedRoute } from '@/types/resolved'
import { RouteStateByName } from '@/types/state'

export type RouterResolveOptions<
  TState = unknown
> = {
  query?: QuerySource,
  hash?: string,
  state?: Partial<TState>,
}

type RouterResolveArgs<
  TRoutes extends Routes,
  TSource extends RoutesName<TRoutes>
> = AllPropertiesAreOptional<RouteParamsByKey<TRoutes, TSource>> extends true
  ? [params?: RouteParamsByKey<TRoutes, TSource>, options?: RouterResolveOptions<RouteStateByName<TRoutes, TSource>>]
  : [params: RouteParamsByKey<TRoutes, TSource>, options?: RouterResolveOptions<RouteStateByName<TRoutes, TSource>>]

export type RouterResolve<
  TRoutes extends Routes
> = <TSource extends RoutesName<TRoutes>>(name: TSource, ...args: RouterResolveArgs<TRoutes, TSource>) => ResolvedRoute

import { component } from '@/utilities/testHelpers'
import { ExtractParamName, ExtractRouteParamTypesOptionalReading, ExtractRouteParamTypesOptionalWriting, ExtractWithParamsParamType } from './params'
import { createRoute } from '@/services/createRoute'
import { withDefault } from '@/services/withDefault'
import { unionOf } from '@/services/unionOf'

const home = createRoute({
  name: 'home',
  path: '/',
  component,
})

const settings = createRoute({
  name: 'settings',
  path: '/settings',
  query: 'search=[?search]',
  component,
})

const profile = createRoute({
  parent: settings,
  name: 'settings.profile',
  path: '/profile',
  component,
})

const keys = createRoute({
  parent: settings,
  name: 'settings.keys',
  path: '/keys',
  query: withParams('sort=[?sort]', {
    sort: withDefault(unionOf('asc', 'desc'), 'asc'),
  }),
  component,
})

type TK = typeof profile['query']
//    ^?
type T0 = typeof keys['query']
//    ^?

const routes = [home, settings, profile, keys] as const

type T1 = RouteParamsByKey<typeof routes, 'settings.keys'>
//    ^?

type T2 = ExtractRouteParamTypesOptionalReading<typeof keys>
type T3 = ExtractRouteParamTypesOptionalWriting<typeof keys>
