import { Route, Routes, CreatedRouteOptions } from '@/types/route'
import { UnionToIntersection } from '@/types/utilities'

declare const routerContextType: unique symbol

/**
 * Carries the context a route requires as a type. Created with {@link routerContext}, read back when the
 * route is given to `createRouter`.
 */
export type RouterContextType<TContext extends Record<string, unknown> = Record<string, unknown>> = {
  readonly [routerContextType]?: TContext,
}

/**
 * Declares the context a route requires the router to be created with.
 *
 * ```ts
 * const route = createRoute({
 *   name: 'user',
 *   path: '/user/[id]',
 *   routerContext: routerContext<{ session: Session }>(),
 * })
 * ```
 *
 * The requirement is inherited by children and folded up when routes are given to `createRouter`, which
 * then requires a `context` satisfying every route's declaration.
 */
export function routerContext<TContext extends Record<string, unknown>>(): RouterContextType<TContext> {
  return {}
}

/**
 * The context every matched route requires, combined. Mirrors meta: an intersection from greatest
 * ancestor to narrowest matched, so a child requires everything its parents do.
 */
export type RouteContextRequirement<TMatches extends CreatedRouteOptions[]> = CreatedRouteOptions[] extends TMatches
  ? Record<string, unknown>
  : TMatches extends [infer THead, ...infer TRest extends CreatedRouteOptions[]]
    ? (THead extends { routerContext: RouterContextType<infer TContext> } ? TContext : {}) & RouteContextRequirement<TRest>
    : {}

type ToRouteContextRequirement<TRoute> = TRoute extends Route ? RouteContextRequirement<TRoute['matches']> : never

/**
 * The context a router over these routes must be created with: the combined requirement of every route.
 */
export type RoutesContextRequirement<TRoutes extends Routes> = UnionToIntersection<ToRouteContextRequirement<TRoutes[number]>>

/**
 * The `context` router option for a set of routes: required when any route declares a requirement,
 * optional otherwise.
 */
export type RouterContextOptions<TRoutes extends Routes> = Record<string, unknown> extends RoutesContextRequirement<TRoutes>
  ? { context?: Record<string, unknown> }
  : {} extends RoutesContextRequirement<TRoutes>
      ? { context?: Record<string, unknown> }
      : { context: RoutesContextRequirement<TRoutes> }

/**
 * The context a router was created with: what the options supplied when inference kept it, otherwise the
 * combined requirement of the routes — which is the contract the supplied value had to satisfy.
 */
export type RouterContextOf<TRoutes extends Routes, TOptions> = [TOptions] extends [{ context: infer TContext extends Record<string, unknown> }]
  ? TContext
  : {} extends RoutesContextRequirement<TRoutes>
      ? Record<string, unknown>
      : RoutesContextRequirement<TRoutes>
