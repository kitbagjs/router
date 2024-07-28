import { Route, Routes } from '@/types/route'
import { Router } from '@/types/router'
import { RouterPush } from '@/types/routerPush'
import { RouterReplace } from '@/types/routerReplace'
import { RoutesKey, RoutesMap } from '@/types/routesMap'

/**
 * Represents the state of currently registered router, rejections, and route meta. Used to provide correct type context for
 * components like `RouterLink`, as well as for composables like `useRouter`, `useRoute`, and hooks.
 *
 * @example
 * ```ts
 * declare module '@kitbag/router' {
 *   interface Register {
 *     router: typeof router
 *     rejections: ["NotAuthorized"],
 *     routeMeta: { public?: boolean }
 *   }
 * }
 * ```
 */
export interface Register {}

/**
 * Represents the Router property within {@link Register}
 */
export type RegisteredRouter = Register extends { router: infer TRouter }
  ? TRouter
  : Register extends { Router: infer TRouter }
    ? TRouter
    : Router

/**
 * Represents the Router routes property within {@link Register}
 */
export type RegisteredRoutes = Register extends { router: Router<infer TRoutes extends Routes> }
  ? TRoutes
  : Register extends { Router: Router<infer TRoutes extends Routes> }
    ? TRoutes
    : Route[]

/**
 * Represents the possible Rejections registered within {@link Register}
 */
export type RegisteredRejectionType = Register extends { rejections: infer TRejections extends string[] }
  ? TRejections[number]
  : Register extends { Rejections: infer TRejections extends string[] }
    ? TRejections
    : never

/**
 * Represents additional metadata associated with a route, customizable via declaration merging.
 */
export type RouteMeta = Register extends { routeMeta: infer RouteMeta extends Record<string, unknown> }
  ? RouteMeta
  : Register extends { RouteMeta: infer RouteMeta extends Record<string, unknown> }
    ? RouteMeta
    : Record<string, unknown>

/**
 * Represents the Router property within {@link Register}
 */
export type RegisteredRouterRoute = RegisteredRouter['route']

/**
 * Represents the a map of all possible RouteKeys with corresponding Route registered within {@link Register}
 */
export type RegisteredRouteMap = RoutesMap<RegisteredRoutes>

/**
 * Represents the union of all possible RouteKeys registered within {@link Register}
 */
export type RegisteredRoutesKey = RoutesKey<RegisteredRoutes>

/**
 * Represents the type for router `push`, with types for routes registered within {@link Register}
 */
export type RegisteredRouterPush = RouterPush<RegisteredRoutes>

/**
 * Represents the type for router `replace`, with types for routes registered within {@link Register}
 */
export type RegisteredRouterReplace = RouterReplace<RegisteredRoutes>