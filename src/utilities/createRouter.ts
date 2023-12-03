import { RouteMethods } from '@/types/routeMethods'
import { Routes } from '@/types/routes'

type Router<T extends Routes> = {
  routes: RouteMethods<T, Record<never, never>>,
}

export function createRouter<T extends Routes>(_routes: T): Router<T> {
  throw 'not implemented'
}