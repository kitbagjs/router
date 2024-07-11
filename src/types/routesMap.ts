import { Route, Routes } from '@/types/route'
import { StringHasValue } from '@/utilities'

type RouteIsNamedAndNotDisabled<T extends Route> = IsRouteDisabled<T> extends true
  ? never
  : IsRouteNamed<T> extends true
    ? T
    : never
type IsRouteDisabled<T extends Route> = T extends { disabled: true } ? true : false
type IsRouteNamed<T extends Route> = StringHasValue<T['key']>

export type RoutesMap<TRoutes extends Routes = []> = {
  [K in TRoutes[number] as RouteIsNamedAndNotDisabled<K>['key']]: RouteIsNamedAndNotDisabled<K>
}

export type RoutesKey<TRoutes extends Routes> = string & keyof RoutesMap<TRoutes>