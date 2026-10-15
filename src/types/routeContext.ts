import { CreateRouteOptions } from './createRouteOptions'
import { Rejection, Rejections } from './rejection'
import { GenericRoute, Route, Routes } from './route'

export type RouteContext = GenericRoute | Rejection

export type ToRouteContext<TContext extends RouteContext[] | readonly RouteContext[] | undefined> = TContext extends RouteContext[]
  ? TContext
  : []

export type ExtractRouteContext<
  TOptions extends CreateRouteOptions
> = TOptions extends { context: infer TContext extends RouteContext[] }
  ? TOptions extends { parent: infer TParent extends Route }
    ? [...ToRouteContext<TParent['context']>, ...TContext]
    : TContext
  : TOptions extends { parent: infer TParent extends Route }
    ? ToRouteContext<TParent['context']>
    : []

export type ExtractRouteContextRoutes<
  TOptions extends CreateRouteOptions
> = RouteContextToRoute<ExtractRouteContext<TOptions>>

export type ExtractRouteContextRejections<
  TOptions extends CreateRouteOptions
> = RouteContextToRejection<ExtractRouteContext<TOptions>>

export type RouteContextToRoute<TContext extends RouteContext[] | undefined> = RouteContext[] extends TContext
  ? Routes
  : undefined extends TContext
    ? Routes
    : FilterRouteContextRoutes<TContext>

type FilterRouteContextRoutes<TContext extends RouteContext[] | undefined> = TContext extends [infer First, ...infer Rest extends RouteContext[]]
  ? First extends GenericRoute
    ? [First, ...FilterRouteContextRoutes<Rest>]
    : FilterRouteContextRoutes<Rest>
  : []

export type RouteContextToRejection<TContext extends RouteContext[] | undefined> = RouteContext[] extends TContext
  ? Rejections
  : undefined extends TContext
    ? Rejections
    : FilterRouteContextRejections<TContext>

type FilterRouteContextRejections<TContext extends RouteContext[] | undefined> = TContext extends [infer First, ...infer Rest extends RouteContext[]]
  ? First extends Rejection
    ? [First, ...FilterRouteContextRejections<Rest>]
    : FilterRouteContextRejections<Rest>
  : []

export type GetContext = () => readonly RouteContext[]

export function hasGetContext<T>(value: T): value is T & { getContext: GetContext } {
  if (typeof value !== 'function' && (typeof value !== 'object' || value === null)) {
    return false
  }

  return 'getContext' in value && typeof value.getContext === 'function'
}
