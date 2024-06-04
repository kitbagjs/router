import { Route, Routes } from '@/types/route'

type NamedNotDisabledRoute = Route & { key: string, disabled: false }

export type RoutesMap<TRoutes extends Routes = []> = {
  [Route in TRoutes[number] as Route extends NamedNotDisabledRoute ? Route['key']: never]: Route
}

export type RoutesKey<TRoutes extends Routes> = string & keyof RoutesMap<TRoutes>
