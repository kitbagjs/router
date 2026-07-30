import { Component } from 'vue'
import { PrefetchConfig } from '@/types/prefetch'
import { AnyFunction } from '@/types/utilities'

/**
 * A single view: what to render, how to get its props, and how to prefetch it. `component` is optional
 * because a route can bind props to the nested RouterView it renders without declaring a component.
 *
 * @template TProps - What this view's props getter returns, carried so parent props can be typed from it.
 */
export type RouteView<TProps = undefined> = {
  component?: Component,
  props?: AnyFunction<TProps>,
  prefetch?: PrefetchConfig,
}

/**
 * The views for a single route, keyed by view name (the unnamed view under 'default'). Indexed by depth in
 * `route.views` — parallel to how `route.matches` indexes the matched options, which is where a route's id
 * comes from at a given depth.
 */
export type RouteViews = Record<string, RouteView<unknown>>

/**
 * The props a child sees for a parent's views. A lone unnamed view is given directly rather than under a
 * 'default' key, matching how the props argument is written.
 */
export type ViewsPropsReturnType<TViews> = keyof ViewsWithProps<TViews> extends never
  ? undefined
  : keyof ViewsWithProps<TViews> extends 'default'
    ? ViewProps<Extract<ViewsWithProps<TViews>, { default: unknown }>['default']>
    : { [K in keyof ViewsWithProps<TViews>]: ViewProps<ViewsWithProps<TViews>[K]> }

type ViewsWithProps<TViews> = {
  [K in keyof TViews as [ViewProps<TViews[K]>] extends [undefined] ? never : K]: TViews[K]
}

type ViewProps<TView> = TView extends { props?: AnyFunction<infer TProps> } ? TProps : undefined
