import { Route, Routes } from '@/types/route'
import { StringHasValue } from '@/utilities'

type RouteIsNamedAndNotDisabled<T extends Route> = IsRouteDisabled<T> extends true
  ? never
  : IsRouteUnnamed<T> extends true
    ? never
    : T
type IsRouteDisabled<T extends Route> = T extends { disabled: true } ? true : false
type IsRouteUnnamed<T extends Route> = StringHasValue<T['key']> extends true ? false : true

export type RoutesMap<TRoutes extends Routes = []> = {
  [K in TRoutes[number] as RouteIsNamedAndNotDisabled<K>['key']]: RouteIsNamedAndNotDisabled<K>
}

export type RoutesKey<TRoutes extends Routes> = string & keyof RoutesMap<TRoutes>