import { Routes } from '../types/routes'
import { RouteMethods } from '../types/routeMethods'

export function createRouter<T extends Routes>(_routes: T): { routes: RouteMethods<T, {}> } {
  throw 'not implemented'
}