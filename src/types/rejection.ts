import { Component, Ref } from 'vue'
import { CreatedRouteOptions, isRoute, Route, RouteInternal } from '@/types/route'
import { Router, RouterRoutes } from '@/types/router'
import { ToUrl } from '@/types/url'
import { RouteView, RouteViews } from '@/types/routeViews'

export const BUILT_IN_REJECTIONS = {
  NotFound: 404,
} as const

export type BuiltInRejectionType = keyof typeof BUILT_IN_REJECTIONS

export const NOT_FOUND_REJECTION_TYPE = 'NotFound' satisfies BuiltInRejectionType

export type RouterRejection<T extends Rejection = Rejection> = Readonly<Ref<T | null>>
export type RouterRejections<TRouter extends Router> = ExtractRouteRejections<RouterRoutes<TRouter>>[number]

export function isRejection(value: unknown): value is Rejection & RouteInternal {
  return isRoute(value) && value.matches.at(-1)?.rejection === true
}

export type RejectionMatch<TName extends string = string, TViews extends RouteViews = { default: RouteView }> = Omit<CreatedRouteOptions, 'name' | 'views' | 'loaders' | 'meta' | 'state'> & {
  name: TName,
  rejection: true,
  views: TViews,
  loaders: {},
  meta: {},
  state: {},
}

/**
 * Represents an immutable array of Rejection instances.
 */
export type Rejections = readonly Rejection[]

export type RejectionOptions<TType extends string = string> = {
  /**
   * The type of rejection.
   */
  type: TType,
  /**
   * The component rendered while this rejection is in effect.
   */
  component?: Component,
  /**
   * The http status a server should respond with while this rejection is in effect. 404 for something
   * missing, 401 or 403 for something gated, 503 for something temporary. Defaults to 200.
   */
  status?: number,
}

export type Rejection<TName extends string = string> = Route<ToUrl<{}>, [RejectionMatch<TName, RouteViews>]>

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

export type ExtractRouteRejections<TRoutes extends readonly Route[]> = [Extract<TRoutes[number], Rejection>] extends [never]
  ? []
  : readonly Extract<TRoutes[number], Rejection>[]
