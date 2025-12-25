import { Rejection } from './rejection'
import { GenericRoute, Route } from './route'

export type RouteContext = GenericRoute | Rejection

export type ToRouteContext<TContext extends RouteContext[] | undefined> = TContext extends RouteContext[]
  ? TContext
  : []

export type RouteContextToRoute<TContext extends RouteContext[] | undefined> =
RouteContext[] extends TContext
  ? Route[]
  : undefined extends TContext
    ? Route[]
    : FilterRouteContextRoutes<TContext>

type FilterRouteContextRoutes<TContext extends RouteContext[] | undefined> =
TContext extends [infer First, ...infer Rest extends RouteContext[]]
  ? First extends GenericRoute
    ? [First, ...FilterRouteContextRoutes<Rest>]
    : FilterRouteContextRoutes<Rest>
  : []

export type RouteContextToRejection<TContext extends RouteContext[] | undefined> =
RouteContext[] extends TContext
  ? Rejection[]
  : undefined extends TContext
    ? Rejection[]
    : FilterRouteContextRejections<TContext>

type FilterRouteContextRejections<TContext extends RouteContext[] | undefined> =
 TContext extends [infer First, ...infer Rest extends RouteContext[]]
   ? First extends Rejection
     ? [First, ...FilterRouteContextRejections<Rest>]
     : FilterRouteContextRejections<Rest>
   : []
