import { Component } from 'vue'
import { ComponentProps } from '@/services/component'
import { ComponentPropsAreOptional, PropsGetter } from '@/types/createRouteOptions'
import { InternalRouteHooks } from '@/types/hooks'
import { ResolvedRoute } from '@/types/resolved'
import { CreatedRouteOptions, Route } from '@/types/route'
import { RouteContextToRejection, RouteContextToRoute } from '@/types/routeContext'
import { RouteRedirects } from '@/types/redirects'
import { RouteSetTitle } from '@/types/routeTitle'
import { RouterPush } from '@/types/routerPush'
import { RouterReject } from '@/types/routerReject'
import { RouterReplace } from '@/types/routerReplace'
import { RouteUpdate } from '@/types/routeUpdate'
import { PrefetchConfig } from '@/types/prefetch'
import { RouteViews } from '@/types/routeViews'
import { Url } from '@/types/url'
import { AnyFunction, Identity, LastInArray, MaybePromise } from '@/types/utilities'

/**
 * The props getter for a view added via `addView`. Receives the same two arguments as the
 * `createRoute` props callback: the resolved route and a context object.
 */
export type AddViewPropsGetter<
  TRoute extends Route,
  TComponent extends Component
> = (route: ResolvedRoute<TRoute>, context: AddViewPropsCallbackContext<TRoute>) => MaybePromise<ComponentProps<TComponent>>

/**
 * Context provided to an `addView` props getter. Sourced from the route: rejections/routes from the
 * route's context, and the parent from the route's `views`/`matches` tuples.
 */
export type AddViewPropsCallbackContext<
  TRoute extends Route
> = {
  reject: RouterReject<RouteContextToRejection<TRoute['context']>>,
  push: RouterPush<[TRoute] | RouteContextToRoute<TRoute['context']>>,
  replace: RouterReplace<[TRoute] | RouteContextToRoute<TRoute['context']>>,
  update: RouteUpdate<ResolvedRoute<TRoute>>,
  parent: AddViewParent<TRoute>,
}

/**
 * The parent context ({ name, props }) reconstructed from the route's tuples: the parent's name from
 * the second-to-last `matches` entry and its prop return types from the second-to-last `views` entry.
 */
type AddViewParent<
  TRoute extends Route
> = TRoute['views'] extends [...RouteViews[], infer TParentView extends RouteViews, RouteViews]
  ? {
      name: ParentMatchName<TRoute['matches']>,
      props: MatchPropsReturnType<TParentView['props']>,
    }
  : undefined

type ParentMatchName<
  TMatches extends CreatedRouteOptions[]
> = TMatches extends [...CreatedRouteOptions[], infer TParent extends CreatedRouteOptions, CreatedRouteOptions]
  ? TParent['name']
  : string

/**
 * Always a promise, since the parent's props may not have been computed when the child's getter runs.
 */
type MatchPropsReturnType<TProps> = TProps extends AnyFunction
  ? Promise<Awaited<ReturnType<TProps>>>
  : TProps extends Record<string, AnyFunction>
    ? { [K in keyof TProps]: Promise<Awaited<ReturnType<TProps[K]>>> }
    : undefined

/**
 * When the getter is omitted the default type param resolves to the wide getter type, which then
 * "extends" itself and collapses to undefined. When a getter is provided it is narrower and preserved.
 */
type NewViewGetter<
  TRoute extends Route,
  TComponent extends Component,
  TGetter
> = AddViewPropsGetter<TRoute, TComponent> extends TGetter ? undefined : TGetter

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
 * The current route's own view prop getters (the last entry of its `views` tuple).
 */
type CurrentViewProps<
  TRoute extends Route
> = LastInArray<TRoute['views']> extends RouteViews<infer TProps> ? TProps : undefined

/**
 * Computes the new view props type after adding a view. A lone default view is stored as a bare getter;
 * adding a named view promotes to a record, pulling any existing bare default under 'default'.
 */
export type AddViewProps<
  TCurrent,
  TName extends string | undefined,
  TNewGetter
> = [TNewGetter] extends [undefined]
  ? TCurrent
  : TName extends undefined
    ? TCurrent extends undefined
      ? TNewGetter
      : TCurrent extends AnyFunction
        ? TNewGetter
        : Identity<TCurrent & { default: TNewGetter }>
    : TCurrent extends undefined
      ? Identity<Record<TName & string, TNewGetter>>
      : TCurrent extends AnyFunction
        ? Identity<{ default: TCurrent } & Record<TName & string, TNewGetter>>
        : Identity<TCurrent & Record<TName & string, TNewGetter>>

/**
 * Replaces the props of the last view in a views tuple, preserving all ancestor views.
 */
type ReplaceLastViewProps<
  TViews extends RouteViews[],
  TNewProps
> = TViews extends [...infer THead extends RouteViews[], RouteViews]
  ? [...THead, RouteViews<TNewProps>]
  : TViews

/**
 * Rebuilds a Route with the last view's props updated. Uses indexed access + Pick to recover the Url slot.
 */
type WithViewProps<
  TRoute extends Route,
  TNewProps
> = Route<
  Pick<TRoute, keyof Url>,
  TRoute['matches'],
  ReplaceLastViewProps<TRoute['views'], TNewProps>
>

/**
 * A route plus every chainable/available method: addView itself, hooks, redirects, and title.
 */
type RouteWithMethods<TRoute extends Route> = TRoute
  & RouteAddView<TRoute>
  & InternalRouteHooks<TRoute, TRoute['context']>
  & RouteRedirects<TRoute>
  & RouteSetTitle<TRoute>

/**
 * The full return type of an `addView` call: the refined route with all methods re-attached.
 */
type AddViewReturn<
  TRoute extends Route,
  TNewProps
> = WithViewProps<TRoute, TNewProps> extends infer TNext extends Route
  ? RouteWithMethods<TNext>
  : never

/**
 * Adds a view (component + optional props getter) to a route. Chainable to register multiple views,
 * including named views for named `<router-view />`s.
 */
export type RouteAddView<TRoute extends Route = Route> = {
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
    const TGetter extends AddViewPropsGetter<TRoute, TComponent> = AddViewPropsGetter<TRoute, TComponent>
  >(
    component: TComponent,
    ...options: AddViewArgs<TComponent, TName, TGetter>
  ) => AddViewReturn<TRoute, AddViewProps<CurrentViewProps<TRoute>, TName, NewViewGetter<TRoute, TComponent, TGetter>>>,
}
