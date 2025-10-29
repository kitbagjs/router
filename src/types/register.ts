import { BuiltInRejectionType } from '@/services/createRouterReject'
import { Route, Routes } from '@/types/route'
import { Router, RouterOptions } from '@/types/router'
import { RouterPush } from '@/types/routerPush'
import { RouterReplace } from '@/types/routerReplace'
import { RoutesName } from './routesMap'

/**
 * Represents the state of currently registered router, and route meta. Used to provide correct type context for
 * components like `RouterLink`, as well as for composables like `useRouter`, `useRoute`, and hooks.
 *
 * @example
 * ```ts
 * declare module '@kitbag/router' {
 *   interface Register {
 *     router: typeof router
 *     routeMeta: { public?: boolean }
 *   }
 * }
 * ```
 */
export interface Register {}

/**
 * Represents the Router property within {@link Register}
 */
export type RegisteredRouter<T = Register> = T extends { router: infer TRouter }
  ? TRouter
  : Router

/**
 * Represents the Router routes property within {@link Register}
 * @deprecated will be removed in a future version
 */
export type RegisteredRoutes<T = Register> = T extends { router: Router<infer TRoutes extends Routes> }
  ? TRoutes
  : Route[]

/**
 * Represents the possible Rejections registered within {@link Register}
 */
export type RegisteredRejectionType<T = Register> = T extends { router: Router<any, infer TOptions extends RouterOptions> }
  ? keyof TOptions['rejections'] | BuiltInRejectionType
  : BuiltInRejectionType

/**
 * Represents additional metadata associated with a route, customizable via declaration merging.
 */
export type RouteMeta<T = Register> = T extends { routeMeta: infer RouteMeta extends Record<string, unknown> }
  ? RouteMeta
  : Record<string, unknown>

/**
 * Represents the type for router `push`, with types for routes registered within {@link Register}
 * @deprecated will be removed in a future version
 */
export type RegisteredRouterPush = RouterPush<RegisteredRoutes>

/**
 * Represents the type for router `replace`, with types for routes registered within {@link Register}
 * @deprecated will be removed in a future version
 */
export type RegisteredRouterReplace = RouterReplace<RegisteredRoutes>

/**
 * Type for Router Reject method. Triggers rejections registered within {@link Register}
 * @deprecated will be removed in a future version
 */
export type RegisteredRouterReject = (type: RegisteredRejectionType) => void

/**
 * Represents the union of all possible route names registered within {@link Register}
 * @deprecated will be removed in a future version
 */
export type RegisteredRoutesName = RoutesName<RegisteredRoutes>
