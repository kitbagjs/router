import { RouteMethods } from '@/types/routeMethods'
import { Routes } from '@/types/routes'

export function createRouter<T extends Routes>(_routes: T): { routes: RouteMethods<T, {}> } {
  throw 'not implemented'
}