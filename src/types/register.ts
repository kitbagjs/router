import { Host } from '@/types/host'
import { Path } from '@/types/path'
import { Query } from '@/types/query'
import { Route, Routes } from '@/types/route'
import { Router } from '@/types/router'
import { RouterPush } from '@/types/routerPush'
import { RouterReplace } from '@/types/routerReplace'
import { RoutesKey, RoutesMap } from '@/types/routesMap'

/**
 * Represents the state of currently registered router, and rejections. Used to provide correct type context for
 * components like `RouterLink`, as well as for composables like `useRouter`, `useRoute`, and hooks.
 *
 * @example
 * ```ts
 * declare module '@kitbag/router' {
 *   interface Register {
 *     router: typeof router
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
  : Router

/**
 * Represents the Router property within {@link Register}
 */
export type RegisteredRouterRoute = RegisteredRouter['route']

/**
 * Represents the Router routes property within {@link Register}
 */
export type RegisteredRoutes = Register extends { router: Router<infer TRoutes extends Routes> }
  ? TRoutes
  : Route<string, Host, Path, Query, false>[]

/**
 * Represents the possible Rejections registered within {@link Register}
 */
export type RegisteredRejectionType = Register extends { rejections: infer TRejections extends string[] }
  ? TRejections[number]
  : never

/**
 * Represents the State property registered within {@link Register}
 */
export type RegisteredRouterState = Register extends { state: infer TState }
  ? TState
  : {}

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

/**
 * Represents additional metadata associated with a route, customizable via declaration merging.
 * @example
 * ```ts
 * declare module '@kitbag/router' {
 *   interface RouteMeta {
 *     pageTitle?: string
 *   }
 * }
 * ```
 */
export interface RouteMeta extends Record<string, unknown> {}