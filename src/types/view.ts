import { Component } from 'vue'
import { ComponentProps } from '@/services/component'
import { TransformerOptions } from '@/services/payload'
import { PrefetchConfig } from '@/types/prefetch'
import { Routes } from '@/types/route'
import { GetContext, RouteContext, RouteContextToRejection, RouteContextToRoute } from '@/types/routeContext'
import { Register } from '@/types/register'
import { ResolvedRoute, ResolvedRouteUnion, WithData } from '@/types/resolved'
import { Router, RouterRoutes } from '@/types/router'
import { RouterPush } from '@/types/routerPush'
import { RouterReplace } from '@/types/routerReplace'
import { RouterReject } from '@/types/routerReject'
import { AnyFunction, MaybePromise } from '@/types/utilities'

export const IS_VIEW_SYMBOL = Symbol('IS_VIEW_SYMBOL')

export type ViewInternal = {
  [IS_VIEW_SYMBOL]: true,
  getContext: GetContext,
}

/**
 * The resolved route and its loader data available to a reusable view.
 */
export type ViewRoute<TRegister = Register> = TRegister extends { router: infer TRouter extends Router }
  ? ViewRouteUnion<RouterRoutes<TRouter>>
  : ResolvedRoute & WithData

type ViewRouteUnion<TRoutes extends Routes> = {
  [K in keyof TRoutes]: ResolvedRouteUnion<TRoutes[K]> & WithData<TRoutes[K]>
}[number]

/**
 * Navigation helpers available to a reusable view from its declared context.
 */
export type ViewCallbackContext<TContext extends readonly RouteContext[] = []> = {
  push: RouterPush<RouteContextToRoute<[...TContext]>>,
  replace: RouterReplace<RouteContextToRoute<[...TContext]>>,
  reject: RouterReject<RouteContextToRejection<[...TContext]>>,
  signal: AbortSignal,
}

export type ViewPropsGetter<TContext extends readonly RouteContext[], TProps> = (route: ViewRoute, context: ViewCallbackContext<TContext>) => TProps

/**
 * Options for a reusable component and its props getter.
 */
export type CreateViewOptions<
  TComponent extends Component = Component,
  TContext extends readonly RouteContext[] = [],
  TProps extends MaybePromise<ComponentProps<TComponent>> = MaybePromise<ComponentProps<TComponent>>
> = TransformerOptions<NoInfer<Awaited<TProps>>> & {
  component: TComponent,
  /**
   * See [Context](https://kitbag-router.netlify.app/core-concepts/routes#context).
   */
  context?: TContext,
  prefetch?: PrefetchConfig,
} & (Partial<ComponentProps<TComponent>> extends ComponentProps<TComponent>
  ? { props?: ViewPropsGetter<TContext, TProps> }
  : { props: ViewPropsGetter<TContext, TProps> })

/**
 * A reusable view definition with its props getter's result and declared context.
 */
export type View<TProps = unknown, TContext extends readonly RouteContext[] = []> = TransformerOptions<Awaited<TProps>> & {
  component: Component,
  props?: AnyFunction<TProps>,
  context: TContext,
  prefetch?: PrefetchConfig,
}

export type AnyView = View<any, readonly RouteContext[]>

/**
 * Determines whether a value is a reusable view.
 */
export function isView(value: unknown): value is AnyView & ViewInternal {
  return typeof value === 'object' && value !== null && IS_VIEW_SYMBOL in value
}
