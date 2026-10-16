import { Routes } from '@/types/route'
import { Component } from 'vue'
import { ComponentProps } from '@/services/component'
import { RouteContext } from '@/types/routeContext'
import { CreateViewOptions, IS_VIEW_SYMBOL, View, ViewInternal, ViewPropsGetter } from '@/types/view'
import { MaybePromise } from '@/types/utilities'

/**
 * Creates a reusable view that receives the resolved route when computing its props.
 */
export function createView<
  TComponent extends Component,
  const TContext extends readonly RouteContext[] = [],
  TProps extends MaybePromise<ComponentProps<TComponent>> = MaybePromise<ComponentProps<TComponent>>,
  TRoutes extends Routes = Routes
>(options: CreateViewOptions<TComponent, TContext, TProps, TRoutes> & { props: ViewPropsGetter<TContext, TProps, TRoutes> }): View<TProps, TContext>

export function createView<
  TComponent extends Component,
  const TContext extends readonly RouteContext[] = [],
  TRoutes extends Routes = Routes
>(options: Omit<CreateViewOptions<TComponent, TContext, MaybePromise<ComponentProps<TComponent>>, TRoutes>, 'props'> & { props?: never } & (
  Partial<ComponentProps<TComponent>> extends ComponentProps<TComponent> ? {} : never
)): View<undefined, TContext>

export function createView(options: CreateViewOptions<Component, any, any>): View<any, any> {
  const context = [...options.context ?? []]
  const internal = {
    [IS_VIEW_SYMBOL]: true,
  } satisfies ViewInternal

  return { ...options, ...internal, context }
}
