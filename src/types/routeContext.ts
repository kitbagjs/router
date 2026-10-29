import { CreateRouteOptions } from './createRouteOptions'
import { Rejection, Rejections } from './rejection'
import { GenericRoute, Route, Routes } from './route'
import { Register } from './register'
import { Router, RouterRoutes, RouterRejections } from './router'

export type RouteContext = GenericRoute | Rejection

export type ToRouteContext<TContext extends RouteContext[] | readonly RouteContext[] | undefined> = TContext extends RouteContext[]
  ? TContext
  : []

/**
 * Adds context to an options type while preserving its existing properties and context.
 */
export type WithRouteContext<TOptions extends { context?: RouteContext[] }, TContext extends RouteContext[]> = TContext extends []
  ? TOptions
  : Omit<TOptions, 'context'> & {
    context: [...ToRouteContext<TOptions['context']>, ...TContext],
  }

export type ExtractRouteContext<
  TOptions extends CreateRouteOptions
> = TOptions extends { context: infer TContext extends RouteContext[] }
  ? TOptions extends { parent: infer TParent extends Route }
    ? [...ToRouteContext<TParent['context']>, ...TContext]
    : TContext
  : TOptions extends { parent: infer TParent extends Route }
    ? ToRouteContext<TParent['context']>
    : []

export type ContextRoutes<
  TContext extends readonly RouteContext[] | undefined,
  TRoutes extends Routes = RegisteredContextRoutes
> = [
  ...(Routes extends TRoutes ? [] : TRoutes),
  ...(RouteContext[] extends TContext
    ? Routes
    : undefined extends TContext
      ? Routes
      : FilterRouteContextRoutes<TContext>)
]

type FilterRouteContextRoutes<TContext extends readonly RouteContext[] | undefined> = TContext extends readonly [infer First, ...infer Rest extends RouteContext[]]
  ? First extends GenericRoute
    ? [First, ...FilterRouteContextRoutes<Rest>]
    : FilterRouteContextRoutes<Rest>
  : []

export type ContextRejections<
  TContext extends readonly RouteContext[] | undefined,
  TRejections extends Rejections = RegisteredContextRejections
> = [
  ...(Rejections extends TRejections ? [] : TRejections),
  ...(RouteContext[] extends TContext
    ? Rejections
    : undefined extends TContext
      ? Rejections
      : FilterRouteContextRejections<TContext>)
]

type FilterRouteContextRejections<TContext extends readonly RouteContext[] | undefined> = TContext extends readonly [infer First, ...infer Rest extends RouteContext[]]
  ? First extends Rejection
    ? [First, ...FilterRouteContextRejections<Rest>]
    : FilterRouteContextRejections<Rest>
  : []

export type RegisteredContextRoutes<T = Register> = T extends { router: infer TRouter extends Router }
  ? RouterRoutes<TRouter>
  : []

export type RegisteredContextRejections<T = Register> = T extends { router: infer TRouter extends Router }
  ? RouterRejections<TRouter>
  : []
