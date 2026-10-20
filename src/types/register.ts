import { Router } from '@/types/router'

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
 *
 * Indexes `T['router']` rather than using `infer`. Inferring the router hands back a re-instantiated copy
 * of the router type, which TypeScript then structurally compares against the registered router — every
 * route, method and hook — on each use.
 */
export type RegisteredRouter<T = Register> = T extends { router: unknown }
  ? T['router']
  : Router

/**
 * Represents additional metadata associated with a route, customizable via declaration merging.
 */
export type RouteMeta<T = Register> = T extends { routeMeta: infer RouteMeta extends Record<string, unknown> }
  ? RouteMeta
  : Record<string, unknown>
