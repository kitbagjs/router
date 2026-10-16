import { Component } from 'vue'
import { AnyView } from '@/types/view'
import { RouteContext, WithRouteContext } from '@/types/routeContext'
import { ComponentProps } from '@/services/component'
import { ResolvedRoute, WithData } from '@/types/resolved'
import { CreatedRouteOptions, Route } from '@/types/route'
import { RouteCallbackContext } from '@/types/routeCallbackContext'
import { RouteWithMethods } from '@/types/routeWithMethods'
import { PrefetchConfig } from '@/types/prefetch'
import { TransformerOptions } from '@/services/payload'
import { RouteView, RouteViews } from '@/types/routeViews'
import { Url } from '@/types/url'
import { AnyFunction, Identity, LastInArray, MaybePromise } from '@/types/utilities'

/**
 * The props getter for a view added via `addView`. Receives the resolved route and a context object.
 */
export type AddViewPropsGetter<
  TRoute extends Route,
  TComponent extends Component
> = (route: ResolvedRoute<TRoute> & WithData<TRoute>, context: AddViewPropsCallbackContext<TRoute>) => MaybePromise<ComponentProps<TComponent>>

/**
 * Context provided to an `addView` props getter. The same context a loader is given, since both are
 * callbacks attached to a route.
 */
export type AddViewPropsCallbackContext<
  TRoute extends Route
> = RouteCallbackContext<TRoute>

/**
 * The options for a view added via `addView`.
 *
 * @template TName - The view's name, inferred from the `name` option.
 * @template TGetter - The view's props getter, inferred from the `props` option.
 */
export type AddViewOptions<
  TName extends string | undefined = string,
  TGetter = AddViewPropsGetter<Route, Component>
> = TransformerOptions<PayloadValueOf<TGetter>> & {
  /**
   * The name of the view, rendered by `<router-view name="..." />`. Defaults to the unnamed view.
   */
  name?: TName,
  /**
   * A props getter for the view. Receives the resolved route and a context object.
   */
  props?: TGetter,
  /**
   * Determines what assets are prefetched for this view when a router-link is rendered for this route.
   * Overrides route level prefetch, and is itself overridden by link level prefetch.
   */
  prefetch?: PrefetchConfig,
}

/**
 * What a getter resolves to, which is what its payload options carry.
 */
type PayloadValueOf<TGetter> = TGetter extends (...args: any[]) => any ? Awaited<ReturnType<TGetter>> : unknown

/**
 * The views of the route itself, from the last `matches` entry.
 */
type CurrentMatchViews<
  TMatches extends CreatedRouteOptions[]
> = LastInArray<TMatches> extends { views: infer TViews extends RouteViews } ? TViews : RouteViews

/**
 * Computes the new views after adding a view, replacing any view already stored under the same name.
 */
export type AddViewProps<
  TCurrent extends RouteViews,
  TName extends string | undefined,
  TNewProps
> = Identity<Omit<TCurrent, ViewName<TName>> & Record<ViewName<TName>, [TNewProps] extends [undefined] ? RouteView : RouteView<TNewProps>>> extends infer TNext extends RouteViews
  ? TNext
  : TCurrent

type ViewName<TName extends string | undefined> = TName extends string ? TName : 'default'

/**
 * Replaces the views on the last match, preserving all ancestors.
 */
type ReplaceLastMatchViews<
  TMatches extends CreatedRouteOptions[],
  TNewViews extends RouteViews,
  TContext extends RouteContext[]
> = TMatches extends [...infer THead extends CreatedRouteOptions[], infer TLast extends CreatedRouteOptions]
  ? Identity<Omit<WithRouteContext<TLast, TContext>, 'views'> & { views: TNewViews }> extends infer TNext extends CreatedRouteOptions
    ? [...THead, TNext]
    : TMatches
  : TMatches

/**
 * The full return type of an `addView` call: the same url with the last match's views replaced.
 */
type AddViewReturn<
  TUrl extends Url,
  TMatches extends CreatedRouteOptions[],
  TName extends string | undefined,
  TProps,
  TContext extends RouteContext[] = []
> = ReplaceLastMatchViews<
  TMatches,
  AddViewProps<CurrentMatchViews<TMatches>, TName, TProps>,
  TContext
> extends infer TNext extends CreatedRouteOptions[]
  ? RouteWithMethods<TUrl, TNext>
  : never

/**
 * Adds a view (component + optional props getter) to a route. Chainable to register multiple views,
 * including named views for named `<router-view />`s.
 */
export type RouteAddView<
  TUrl extends Url = Url,
  TMatches extends CreatedRouteOptions[] = CreatedRouteOptions[]
> = {
  /**
   * Adds a view for this route.
   *
   * @param component - The component to render. Rendered by `<router-view name="..." />` when the
   * options carry a name, and by the default `<router-view />` otherwise.
   * @param options - The view's `name`, `props` getter, and `prefetch` config. Required when the
   * component has required props, optional otherwise.
   */
  addView: {
    <
      const TView extends AnyView,
      const TName extends string | undefined = undefined
    >(
      view: TView,
      options?: Omit<AddViewOptions<TName, AnyFunction<ViewPropsOf<TView>>>, 'props'>,
    ): AddViewReturn<TUrl, TMatches, TName, ViewPropsOf<TView>, [...TView['context']]>,

    <
      TComponent extends Component,
      const TName extends string | undefined = undefined,
      const TGetter extends AddViewPropsGetter<Route<TUrl, TMatches>, TComponent> = AddViewPropsGetter<Route<TUrl, TMatches>, TComponent>
    >(
      component: TComponent & (TComponent extends AnyView ? never : {}),
      options: AddViewOptions<TName, TGetter> & { props: TGetter },
    ): AddViewReturn<TUrl, TMatches, TName, ReturnType<TGetter>>,

    <
      TComponent extends Component,
      const TName extends string | undefined = undefined
    >(
      component: TComponent & (TComponent extends AnyView ? never : {}) & (
        Partial<ComponentProps<TComponent>> extends ComponentProps<TComponent> ? {} : never
      ),
      options?: AddViewOptions<TName, undefined>,
    ): AddViewReturn<TUrl, TMatches, TName, undefined>,
  },
}

type ViewPropsOf<TView extends AnyView> = TView extends { props?: AnyFunction<infer TProps> } ? TProps : undefined
