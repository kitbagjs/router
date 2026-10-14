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
  TProps extends MaybePromise<ComponentProps<TComponent>> = MaybePromise<ComponentProps<TComponent>>
>(options: CreateViewOptions<TComponent, TContext, TProps> & { props: ViewPropsGetter<TContext, TProps> }): View<TProps, TContext>

export function createView<
  TComponent extends Component,
  const TContext extends readonly RouteContext[] = []
>(options: Omit<CreateViewOptions<TComponent, TContext>, 'props'> & { props?: never } & (
  Partial<ComponentProps<TComponent>> extends ComponentProps<TComponent> ? {} : never
)): View<undefined, TContext>

export function createView(options: CreateViewOptions<Component, any, any>): View<any, any> {
  const internal = {
    [IS_VIEW_SYMBOL]: true,
  } satisfies ViewInternal

  return { ...options, ...internal, context: [...options.context ?? []] }
}
