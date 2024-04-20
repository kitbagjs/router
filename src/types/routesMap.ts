import { Routes } from '@/types/routerRoute'

type BaseRoute = { name: string, disabled: false, pathParams: Record<string, unknown>, queryParams: Record<string, unknown> }
type NamedNotDisabled<T> = T extends BaseRoute ? T : never

export type RoutesMap<TRoutes extends Routes = []> = {
  [K in TRoutes[number] as NamedNotDisabled<K> extends { name: string } ? NamedNotDisabled<K>['name']: never]: NamedNotDisabled<K>
}

export type RoutesKey<TRoutes extends Routes> = string & keyof RoutesMap<TRoutes>