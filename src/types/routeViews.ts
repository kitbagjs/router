import { AnyPayloadTransformer } from '@/services/payload'
import { Component } from 'vue'
import { PrefetchConfig } from '@/types/prefetch'
import { AnyFunction } from '@/types/utilities'

/**
 * A single view: what to render, how to get its props, and how to prefetch it.
 *
 * @template TProps - What this view's props getter returns, carried so parent props can be typed from it.
 */
export type RouteView<TProps = undefined> = {
  component: Component,
  props?: AnyFunction<TProps>,
  prefetch?: PrefetchConfig,
  transformer?: AnyPayloadTransformer,
}

/**
 * The views for a single match, keyed by view name (the unnamed view under 'default'). Each match in
 * `route.matches` carries its own views.
 */
export type RouteViews = Record<string, RouteView<unknown>>

type ViewsWithProps<TViews> = {
  [K in keyof TViews as HasViewProps<TViews[K]> extends true ? K : never]: TViews[K]
}

/**
 * A view has props unless its getter is absent, which is carried as props resolving to undefined. Asked
 * both ways because a getter that only ever throws resolves to never, which is assignable to undefined
 * without being the absent case.
 */
type HasViewProps<TView> = [ViewProps<TView>] extends [undefined]
  ? [undefined] extends [ViewProps<TView>] ? false : true
  : true

type ViewProps<TView> = TView extends { props?: AnyFunction<infer TProps> } ? TProps : undefined

/**
 * Reads view props by name. Omitting the name selects `default` when declared.
 */
export type GetProps<TViews extends RouteViews = RouteViews> = <TName extends keyof ViewsWithProps<TViews> & string = Extract<'default', keyof ViewsWithProps<TViews>>>(
  ...args: TName extends 'default' ? [name?: TName] : [name: TName]
) => Promise<Awaited<ViewProps<TViews[TName]>>>
