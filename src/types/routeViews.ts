import { AnyPayloadTransformer } from '@/services/payload'
import { Component } from 'vue'
import { PrefetchConfig } from '@/types/prefetch'
import { AnyFunction } from '@/types/utilities'

/**
 * A single view: what to render, how to get its props, and how to prefetch it.
 *
 * @template TProps - What this view's props getter returns, carried so parent props can be typed from it.
 */
export type RouteView<TProps = unknown> = {
  component: Component,
  props?: AnyFunction<TProps>,
  prefetch?: PrefetchConfig,
  transformer?: AnyPayloadTransformer,
}

export type RouteViewWithProps<TProps = unknown> = RouteView<TProps> & {
  props: AnyFunction<TProps>,
}

/**
 * The views for a single match, keyed by view name (the unnamed view under 'default'). Each match in
 * `route.matches` carries its own views.
 */
export type RouteViews = Record<string, RouteView>

type ViewsWithProps<TViews extends RouteViews> = {
  [K in keyof TViews as HasViewProps<TViews[K]> extends true ? K : never]: TViews[K]
}

type HasViewProps<TView extends RouteView> = TView extends { props: AnyFunction } ? true : false

type ViewProps<TView extends RouteView> = ReturnType<NonNullable<TView['props']>>

/**
 * Reads view props by name. Omitting the name selects `default` when declared.
 */
export type GetProps<TViews extends RouteViews = Record<string, RouteViewWithProps>> = <TName extends keyof ViewsWithProps<TViews> & string = Extract<'default', keyof ViewsWithProps<TViews>>>(
  ...args: TName extends 'default' ? [name?: TName] : [name: TName]
) => Promise<Awaited<ViewProps<TViews[TName]>>>
