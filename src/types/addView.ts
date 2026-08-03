import { Component } from 'vue'
import { ComponentProps } from '@/services/component'
import { ComponentPropsAreOptional, PropsGetter } from '@/types/createRouteOptions'
import { ResolvedRouteWithData } from '@/types/resolved'
import { CreatedRouteOptions, Route } from '@/types/route'
import { RouteCallbackContext } from '@/types/routeCallbackContext'
import { RouteWithMethods } from '@/types/routeWithMethods'
import { PrefetchConfig } from '@/types/prefetch'
import { RouteView, RouteViews } from '@/types/routeViews'
import { Url } from '@/types/url'
import { AnyFunction, Identity, LastInArray, MaybePromise } from '@/types/utilities'

/**
 * The props getter for a view added via `addView`. Receives the same two arguments as the
 * `createRoute` props callback: the resolved route and a context object.
 */
export type AddViewPropsGetter<
  TRoute extends Route,
  TComponent extends Component
> = (route: ResolvedRouteWithData<TRoute>, context: AddViewPropsCallbackContext<TRoute>) => MaybePromise<ComponentProps<TComponent>>

/**
 * Context provided to an `addView` props getter. The same context a loader is given, since both are
 * callbacks attached to a route.
 */
export type AddViewPropsCallbackContext<
  TRoute extends Route
> = RouteCallbackContext<TRoute>

/**
 * When the getter is omitted the default type param resolves to the wide getter type, which then
 * "extends" itself and collapses to undefined. When a getter is provided its return type is kept — the
 * view only needs what the props resolve to, not the signature it took to get there.
 */
type NewViewProps<
  TRoute extends Route,
  TComponent extends Component,
  TGetter extends AnyFunction
> = AddViewPropsGetter<TRoute, TComponent> extends TGetter ? undefined : ReturnType<TGetter>

/**
 * The options for a view added via `addView`.
 *
 * @template TName - The view's name, inferred from the `name` option.
 * @template TGetter - The view's props getter, inferred from the `props` option.
 */
export type AddViewOptions<
  TName extends string | undefined = string,
  TGetter = PropsGetter
> = {
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
 * {@link AddViewOptions} with `props` promoted to required. Only reached for components that have
 * required props — everything else uses {@link AddViewOptions}, where `props` stays optional, so a view
 * can always be given a name and a prefetch config without a getter.
 *
 * Spelled out rather than intersected with {@link AddViewOptions} so that the literal `name` still
 * infers through the conditional args tuple.
 */
type AddViewOptionsWithRequiredProps<
  TName extends string | undefined,
  TGetter
> = {
  name?: TName,
  props: TGetter,
  prefetch?: PrefetchConfig,
}

/**
 * The options argument for `addView`, required only when the component has required props. `TName` and
 * `TGetter` are inferred from the object's properties rather than from the object as a whole: inferring
 * the whole object as a `const` type param through this conditional tuple widens the literal name.
 */
type AddViewArgs<
  TComponent extends Component,
  TName extends string | undefined,
  TGetter
> = ComponentPropsAreOptional<TComponent> extends true
  ? [options?: AddViewOptions<TName, TGetter>]
  : [options: AddViewOptionsWithRequiredProps<TName, TGetter>]

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
  TNewViews extends RouteViews
> = TMatches extends [...infer THead extends CreatedRouteOptions[], infer TLast extends CreatedRouteOptions]
  ? Identity<Omit<TLast, 'views'> & { views: TNewViews }> extends infer TNext extends CreatedRouteOptions
    ? [...THead, TNext]
    : TMatches
  : TMatches

/**
 * The full return type of an `addView` call: the same url with the last match's views replaced.
 */
type AddViewReturn<
  TUrl extends Url,
  TMatches extends CreatedRouteOptions[],
  TNewProps extends RouteViews
> = ReplaceLastMatchViews<TMatches, TNewProps> extends infer TNext extends CreatedRouteOptions[]
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
  addView: <
    TComponent extends Component,
    const TName extends string | undefined = undefined,
    const TGetter extends AddViewPropsGetter<Route<TUrl, TMatches>, TComponent> = AddViewPropsGetter<Route<TUrl, TMatches>, TComponent>
  >(
    component: TComponent,
    ...options: AddViewArgs<TComponent, TName, TGetter>
  ) => AddViewReturn<TUrl, TMatches, AddViewProps<CurrentMatchViews<TMatches>, TName, NewViewProps<Route<TUrl, TMatches>, TComponent, TGetter>>>,
}
