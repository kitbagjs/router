import { RouterRoutes } from '@/types/routerRoute'

type BaseRouterRoute = { name: string, disabled: false, pathParams: Record<string, unknown>, queryParams: Record<string, unknown> }
type NamedNotDisabled<T> = T extends BaseRouterRoute ? T : never

export type RoutesMap<TRoutes extends RouterRoutes = []> = {
  [K in TRoutes[number] as NamedNotDisabled<K> extends { name: string } ? NamedNotDisabled<K>['name']: never]: NamedNotDisabled<K>
}

export type RoutesKey<TRoutes extends RouterRoutes> = keyof RoutesMap<TRoutes>