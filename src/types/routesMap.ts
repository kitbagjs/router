import { GenericRoute, GenericRoutes } from '@/types/route'
import { StringHasValue } from '@/utilities/guards'

type IsRouteUnnamed<T extends GenericRoute> = StringHasValue<T['name']> extends true ? false : true
type AsNamedRoute<T extends GenericRoute> = IsRouteUnnamed<T> extends true ? never : T

export type RoutesMap<TRoutes extends GenericRoutes = []> = {
  [K in TRoutes[number] as AsNamedRoute<K>['name']]: AsNamedRoute<K>
}

export type RoutesName<TRoutes extends GenericRoutes> = string & keyof RoutesMap<TRoutes>
