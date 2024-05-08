import { Routes } from '@/types/route'

type BaseRoute = { key: string, disabled: false, path: { params: Record<string, unknown> }, query: { params: Record<string, unknown> } }
type NamedNotDisabled<T> = T extends BaseRoute ? T : never

export type RoutesMap<TRoutes extends Routes = []> = {
  [K in TRoutes[number] as NamedNotDisabled<K> extends { key: string } ? NamedNotDisabled<K>['key']: never]: NamedNotDisabled<K>
}

export type RoutesKey<TRoutes extends Routes> = string & keyof RoutesMap<TRoutes>