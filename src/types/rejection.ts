import { Component, Ref } from 'vue'
import { CreatedRouteOptions, Route, RouteInternal } from '@/types/route'
import { ToRouteMatches } from '@/types/createRouteOptions'
import { RouteWithMethods } from '@/types/routeWithMethods'
import { Url } from '@/types/url'
import { RouteMeta } from '@/types/register'
import { RouteContext } from '@/types/routeContext'
import { PrefetchConfig } from '@/types/prefetch'
import { NavigationBehavior } from '@/types/navigation'
import { ViewTransitionConfig } from '@/types/viewTransition'
import { Router } from '@/types/router'
import { RouterReject } from '@/types/routerReject'

export const BUILT_IN_REJECTIONS = {
  NotFound: 404,
} as const

export type BuiltInRejectionType = keyof typeof BUILT_IN_REJECTIONS

export const NOT_FOUND_REJECTION_TYPE = 'NotFound' satisfies BuiltInRejectionType

export type RouterRejection<T extends Rejection = Rejection> = Ref<T | null>
export type RouterRejections<TRouter extends Router> = TRouter['reject'] extends RouterReject<infer TRejections extends Rejection[]> ? TRejections[number] : never

export const IS_REJECTION_SYMBOL = Symbol('IS_REJECTION_SYMBOL')

export function isRejection(value: unknown): value is Rejection & RejectionInternal {
  return typeof value === 'object' && value !== null && IS_REJECTION_SYMBOL in value
}

export type RejectionInternal = {
  [IS_REJECTION_SYMBOL]: true,
} & RouteInternal

/**
 * Represents an immutable array of Rejection instances.
 */
export type Rejections = readonly Rejection[]

export type RejectionNameOptions<TName extends string = string> = { name: TName } | {
  /**
   * @deprecated Use name instead.
   */
  type: TName,
}

export type RejectionIdentity<TName extends string = string> = {
  name: TName,
  /**
   * @deprecated Use name instead.
   */
  type: TName,
}

export type RejectionOptions<TName extends string = string> = RejectionNameOptions<TName> & {
  meta?: RouteMeta,
  context?: RouteContext[],
  prefetch?: PrefetchConfig,
  navigation?: NavigationBehavior,
  viewTransition?: ViewTransitionConfig,
  parent?: never,
  host?: never,
  path?: never,
  query?: never,
  hash?: never,
  /**
   * The component rendered while this rejection is in effect.
   */
  component?: Component,
  /**
   * The http status a server should respond with while this rejection is in effect. 404 for something
   * missing, 401 or 403 for something gated, 503 for something temporary. Defaults to the router's
   * `rejectStatus`.
   */
  status?: number,
}

export type Rejection<TName extends string = string> = Route<Url<{}>> & RejectionIdentity<TName> & {
  kind: 'rejection',
  status?: number,
}

export type DefaultNotFound = RejectionWithMethods<{ name: 'NotFound', status: 404 }>

export type RejectionWithMethods<TOptions extends RejectionOptions> = ToRouteMatches<TOptions & { name: RejectionNameOf<TOptions> }> extends [infer TMatch extends CreatedRouteOptions]
  ? RouteWithMethods<Url<{}>, [TMatch & { kind: 'rejection' }]>
  : never

type RejectionNameOf<TOptions extends RejectionOptions> = TOptions extends { name: infer TName extends string } ? TName : TOptions extends { type: infer TName extends string } ? TName : never

export type RejectionType<TRejections extends Rejections | undefined> = unknown extends TRejections
  ? never
  : Rejections extends TRejections
    ? string
    : undefined extends TRejections
      ? string
      : TRejections extends Rejections
        ? TRejections[number]['name']
        : never

export type ExtractRejections<T> = T extends { rejections: infer TRejections extends Rejections } ? TRejections : []
export type ExtractRejectionTypes<T extends Rejections> = T[number]['name'] extends string ? T[number]['name'] : never
