import { Routes } from '@/types/route'
import { Component } from 'vue'
import { ComponentProps } from '@/services/component'
import { MaybePromise } from '@/types/utilities'
import { RouteContext } from '@/types/routeContext'
import { CreateViewOptions, IS_VIEW_SYMBOL, View, ViewInternal } from '@/types/view'

/**
 * Creates a reusable view that receives the resolved route when computing its props.
 */
export function createView<
  TComponent extends Component,
  const TContext extends readonly RouteContext[] = [],
  TProps extends MaybePromise<ComponentProps<TComponent>> | undefined = undefined,
  TRoutes extends Routes = Routes
>(options: CreateViewOptions<TComponent, TContext, TProps, TRoutes>): View<TProps, TContext>

export function createView(options: CreateViewOptions<Component, any, any>): View<any, any> {
  const context = [...options.context ?? []]
  const internal = {
    [IS_VIEW_SYMBOL]: true,
  } satisfies ViewInternal

  return { ...options, ...internal, context }
}
