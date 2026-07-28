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
import { RouteViews } from '@/types/routeViews'
import { Url } from '@/types/url'
import { Identity, LastInArray, MaybePromise } from '@/types/utilities'

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

type MatchPropsReturnType<TProps> = TProps extends PropsGetter
  ? ReturnType<TProps>
  : TProps extends Record<string, PropsGetter>
    ? { [K in keyof TProps]: ReturnType<TProps[K]> }
    : undefined

/**
 * When the getter argument is omitted the default type param resolves to the wide getter type, which
 * then "extends" itself and collapses to undefined. When a getter is provided it is narrower and preserved.
 */
type NewViewGetter<
  TRoute extends Route,
  TComponent extends Component,
  TGetter
> = AddViewPropsGetter<TRoute, TComponent> extends TGetter ? undefined : TGetter

/**
 * The props argument for `addView`. Required when the component has required props, otherwise optional.
 */
type AddViewArgs<
  TComponent extends Component,
  TGetter
> = ComponentPropsAreOptional<TComponent> extends true
  ? [props?: TGetter]
  : [props: TGetter]

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
      : TCurrent extends (...args: any[]) => any
        ? TNewGetter
        : Identity<TCurrent & { default: TNewGetter }>
    : TCurrent extends undefined
      ? Identity<Record<TName & string, TNewGetter>>
      : TCurrent extends (...args: any[]) => any
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
  addView: {
    /**
     * Adds the default view for this route.
     *
     * @param component - The component to render in the default `<router-view />`.
     * @param props - A props getter. Required when the component has required props.
     */
    <
      TComponent extends Component,
      const TGetter extends AddViewPropsGetter<TRoute, TComponent> = AddViewPropsGetter<TRoute, TComponent>
    >(
      component: TComponent,
      ...props: AddViewArgs<TComponent, TGetter>
    ): AddViewReturn<TRoute, AddViewProps<CurrentViewProps<TRoute>, undefined, NewViewGetter<TRoute, TComponent, TGetter>>>,

    /**
     * Adds a named view for this route, rendered by `<router-view name="..." />`.
     *
     * @param name - The name of the view.
     * @param component - The component to render in the named `<router-view />`.
     * @param props - A props getter. Required when the component has required props.
     */
    <
      TName extends string,
      TComponent extends Component,
      const TGetter extends AddViewPropsGetter<TRoute, TComponent> = AddViewPropsGetter<TRoute, TComponent>
    >(
      name: TName,
      component: TComponent,
      ...props: AddViewArgs<TComponent, TGetter>
    ): AddViewReturn<TRoute, AddViewProps<CurrentViewProps<TRoute>, TName, NewViewGetter<TRoute, TComponent, TGetter>>>,
  },
}
