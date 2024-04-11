import { Router } from '@/types/router'
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

export type RegisteredRouteMap = RoutesMap
export type RegisteredRouteWithParams<T extends keyof RegisteredRouteMap> = RouteWithParams<RegisteredRoutes, T>