import { Rejections } from '@/types/rejection'
import { Component } from 'vue'
import { ComponentProps } from '@/services/component'
import { TransformerOptions } from '@/services/payload'
import { PrefetchConfig } from '@/types/prefetch'
import { ContextRejections, ContextRoutes, RouteContext } from '@/types/routeContext'
import { ResolvedRouteWithDataUnion } from '@/types/resolved'
import { Routes } from '@/types/route'
import { RouterPush } from '@/types/routerPush'
import { RouterReplace } from '@/types/routerReplace'
import { RouterReject } from '@/types/routerReject'
import { AnyFunction, MaybePromise } from '@/types/utilities'

export const IS_VIEW_SYMBOL = Symbol('IS_VIEW_SYMBOL')

export type ViewInternal = {
  [IS_VIEW_SYMBOL]: true,
}

/**
 * Navigation helpers available to a reusable view from its router and declared context.
 */
export type ViewCallbackContext<
  TContext extends readonly RouteContext[] = [],
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = []
> = {
  push: RouterPush<ContextRoutes<TContext, TRoutes>>,
  replace: RouterReplace<ContextRoutes<TContext, TRoutes>>,
  reject: RouterReject<ContextRejections<TContext, TRejections>>,
  signal: AbortSignal,
}

export type ViewPropsGetter<
  TContext extends readonly RouteContext[],
  TProps,
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = []
> = (route: ResolvedRouteWithDataUnion<TRoutes[number]>, context: ViewCallbackContext<TContext, TRoutes, TRejections>) => TProps

/**
 * Options for a reusable component and its props getter.
 */
export type CreateViewOptions<
  TComponent extends Component = Component,
  TContext extends readonly RouteContext[] = [],
  TProps extends MaybePromise<ComponentProps<TComponent>> | undefined = undefined,
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = []
> = TransformerOptions<NoInfer<Awaited<TProps>>> & {
  component: TComponent,
  /**
   * See [Context](https://kitbag-router.netlify.app/advanced-concepts/context).
   */
  context?: TContext,
  prefetch?: PrefetchConfig,
} & (Partial<ComponentProps<TComponent>> extends ComponentProps<TComponent>
  ? { props?: ViewPropsGetter<TContext, TProps extends undefined ? MaybePromise<ComponentProps<TComponent>> : TProps, TRoutes, TRejections> }
  : { props: ViewPropsGetter<TContext, TProps extends undefined ? MaybePromise<ComponentProps<TComponent>> : TProps, TRoutes, TRejections> })

/**
 * Creates views with props callbacks typed to the router's resolved routes and loader data.
 */
export type CreateView<TRoutes extends Routes = Routes, TRejections extends Rejections = []> = <
  TComponent extends Component,
  const TContext extends readonly RouteContext[] = [],
  TProps extends MaybePromise<ComponentProps<TComponent>> | undefined = undefined
>(options: CreateViewOptions<TComponent, TContext, TProps, TRoutes, TRejections>) => View<TProps, TContext>

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
