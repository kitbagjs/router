import { Route, Routes } from '@/types/route'
import { StringHasValue } from '@/utilities'

type IsRouteUnnamed<T extends Route> = StringHasValue<T['name']> extends true ? false : true
type AsNamedRoute<T extends Route> = IsRouteUnnamed<T> extends true ? never : T

export type RoutesMap<TRoutes extends Routes = []> = {
  [K in TRoutes[number] as AsNamedRoute<K>['name']]: AsNamedRoute<K>
}

export type RoutesName<TRoutes extends Routes> = string & keyof RoutesMap<TRoutes>
