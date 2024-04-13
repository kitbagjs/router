import { Router } from '@/types/router'
import { RouterPush } from '@/types/routerPush'
import { RouterReplace } from '@/types/routerReplace'
import { RouterRoutes } from '@/types/routerRoute'
import { RoutesMap } from '@/types/routesMap'
import { RouteWithParams } from '@/types/routeWithParams'

export interface Register {
  // router: Router
  // rejections: ['Auth'],
  // state: {}
}

export type RegisteredRouter = Register extends { router: infer TRouter }
  ? TRouter
  : Router

export type RegisteredRoutes = Register extends { router: Router<infer Routes extends RouterRoutes> }
  ? Routes
  : []

export type RegisteredRejectionType = Register extends { rejections: infer TRejections extends string[] }
  ? TRejections[number]
  : never

export type RegisteredRouterState = Register extends { state: infer TState }
  ? TState
  : {}
// Because RegisteredRoutes defaults to `[]` it thinks passing it is unnecessary
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments
export type RegisteredRouteMap = RoutesMap<RegisteredRoutes>
export type RegisteredRouteWithParams<T extends keyof RegisteredRouteMap> = RouteWithParams<RegisteredRoutes, T>

export type RegisteredRouterPush = RouterPush<RegisteredRoutes>
export type RegisteredRouterReplace = RouterReplace<RegisteredRoutes>