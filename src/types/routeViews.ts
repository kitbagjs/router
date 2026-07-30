import { Component } from 'vue'
import { PrefetchConfig } from '@/types/prefetch'
import { AnyFunction } from '@/types/utilities'

/**
 * A single view: what to render, how to get its props, and how to prefetch it. `component` is optional
 * because a route can bind props to the nested RouterView it renders without declaring a component.
 *
 * @template TProps - The prop getter for this view, carried so parent props can be typed from it.
 */
export type RouteView<TProps = unknown> = {
  component?: Component,
  props?: TProps,
  prefetch?: PrefetchConfig,
}

/**
 * The views for a single route, keyed by view name (the unnamed view under 'default'). Indexed by depth in
 * `route.views` — parallel to how `route.matches` indexes the matched options, which is where a route's id
 * comes from at a given depth.
 */
export type RouteViews = Record<string, RouteView>

/**
 * The props a child sees for a parent's views. A lone unnamed view is given directly rather than under a
 * 'default' key, matching how the props argument is written. Each view's props are always a promise,
 * since the parent's props may not have been computed when the child's getter runs.
 */
export type ViewsPropsReturnType<TViews> = keyof ViewsWithProps<TViews> extends never
  ? undefined
  : keyof ViewsWithProps<TViews> extends 'default'
    ? ViewPropsReturnType<Extract<ViewsWithProps<TViews>, { default: unknown }>['default']>
    : { [K in keyof ViewsWithProps<TViews>]: ViewPropsReturnType<ViewsWithProps<TViews>[K]> }

type ViewsWithProps<TViews> = {
  [K in keyof TViews as [ViewPropsGetter<TViews[K]>] extends [undefined] ? never : K]: TViews[K]
}

type ViewPropsGetter<TView> = TView extends { props?: infer TGetter } ? TGetter : undefined

type ViewPropsReturnType<TView> = NonNullable<ViewPropsGetter<TView>> extends infer TGetter
  ? TGetter extends AnyFunction ? Promise<Awaited<ReturnType<TGetter>>> : undefined
  : undefined
