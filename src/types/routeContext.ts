import { Rejection, Rejections } from './rejection'
import { GenericRoute, Routes } from './route'

export type RouteContext = GenericRoute | Rejection

export type ToRouteContext<TContext extends RouteContext[] | readonly RouteContext[] | undefined> = TContext extends RouteContext[]
  ? TContext
  : []

export type RouteContextToRoute<TContext extends RouteContext[] | undefined> =
RouteContext[] extends TContext
  ? Routes
  : undefined extends TContext
    ? Routes
    : FilterRouteContextRoutes<TContext>

type FilterRouteContextRoutes<TContext extends RouteContext[] | undefined> =
TContext extends [infer First, ...infer Rest extends RouteContext[]]
  ? First extends GenericRoute
    ? [First, ...FilterRouteContextRoutes<Rest>]
    : FilterRouteContextRoutes<Rest>
  : []

export type RouteContextToRejection<TContext extends RouteContext[] | undefined> =
RouteContext[] extends TContext
  ? Rejections
  : undefined extends TContext
    ? Rejections
    : FilterRouteContextRejections<TContext>

type FilterRouteContextRejections<TContext extends RouteContext[] | undefined> =
 TContext extends [infer First, ...infer Rest extends RouteContext[]]
   ? First extends Rejection
     ? [First, ...FilterRouteContextRejections<Rest>]
     : FilterRouteContextRejections<Rest>
   : []
