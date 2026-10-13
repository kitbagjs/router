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
  component?: Component,
  props?: AnyFunction<TProps>,
  prefetch?: PrefetchConfig,
  transformer?: AnyPayloadTransformer,
}

/**
 * The views for a single match, keyed by view name (the unnamed view under 'default'). Each match in
 * `route.matches` carries its own views.
 */
export type RouteViews = Record<string, RouteView<unknown>>

/**
 * The props a child sees for a parent's views. A lone unnamed view is given directly rather than under a
 * 'default' key. Each view's props are always a promise,
 * since the parent's props may not have been computed when the child's getter runs.
 */
export type ViewsPropsReturnType<TViews> = keyof ViewsWithProps<TViews> extends never
  ? undefined
  : keyof ViewsWithProps<TViews> extends 'default'
    ? ParentViewProps<Extract<ViewsWithProps<TViews>, { default: unknown }>['default']>
    : { [K in keyof ViewsWithProps<TViews>]: ParentViewProps<ViewsWithProps<TViews>[K]> }

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

type ParentViewProps<TView> = Promise<Awaited<ViewProps<TView>>>
