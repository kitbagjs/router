import { HookInternal, HookCallbackContext } from '@/types/hook'
import { HookLifecycle, HookRegistrationOptions, HookRemove, InternalRouteHooks } from '@/types/hooks'
import { Register } from '@/types/register'
import { RegisteredContextRejections, RegisteredContextRoutes, RouteContext } from '@/types/routeContext'
import { CreatedRouteOptions, Route } from '@/types/route'
import { RouteWithMethods, ExternalRouteWithMethods } from '@/types/routeWithMethods'
import { Url } from '@/types/url'
import { ResolvedRoute } from '@/types/resolved'
import { MaybePromise } from '@/types/utilities'

type RouteHookCallback<
  TUrl extends Url,
  TMatches extends CreatedRouteOptions[],
  TRegister
> = (
  route: ResolvedRoute | null,
  context: HookCallbackContext<[
    Route<TUrl, TMatches>,
    ...Route<TUrl, TMatches>['context'],
    ...RegisteredContextRoutes<TRegister>,
    ...RegisteredContextRejections<TRegister>
  ]>,
) => MaybePromise<void>

type RouteHookMethod<
  TUrl extends Url,
  TMatches extends CreatedRouteOptions[],
  TLifecycle extends HookLifecycle
> = {
  // Attaching a typed hook must not resolve registration while the route is being inferred.
  (hook: HookInternal, options?: HookRegistrationOptions): RouteWithMethods<TUrl, TMatches>,
  <TRegister = Register>(
    ...args: Parameters<InternalRouteHooks<Route<TUrl, TMatches>, Route<TUrl, TMatches>['context'], HookRemove, TRegister>[TLifecycle]>
  ): RouteWithMethods<TUrl, TMatches>,
  // Keep a shared callback signature for dynamically selected lifecycles.
  <TRegister = Register>(
    hook: RouteHookCallback<TUrl, TMatches, TRegister>,
    options?: HookRegistrationOptions
  ): RouteWithMethods<TUrl, TMatches>,
}

export type RouteHooks<
  TUrl extends Url = Url,
  TMatches extends CreatedRouteOptions[] = CreatedRouteOptions[]
> = {
  onBeforeRouteEnter: RouteHookMethod<TUrl, TMatches, 'onBeforeRouteEnter'>,
  onBeforeRouteUpdate: RouteHookMethod<TUrl, TMatches, 'onBeforeRouteUpdate'>,
  onBeforeRouteLeave: RouteHookMethod<TUrl, TMatches, 'onBeforeRouteLeave'>,
  onAfterRouteEnter: RouteHookMethod<TUrl, TMatches, 'onAfterRouteEnter'>,
  onAfterRouteUpdate: RouteHookMethod<TUrl, TMatches, 'onAfterRouteUpdate'>,
  onAfterRouteLeave: RouteHookMethod<TUrl, TMatches, 'onAfterRouteLeave'>,
}

type ExternalRouteHookMethod<
  TRoute extends Route,
  TContext extends RouteContext[] | undefined
> = {
  (hook: HookInternal, options?: HookRegistrationOptions): ExternalRouteWithMethods<TRoute, TContext>,
  <TRegister = Register>(
    ...args: Parameters<InternalRouteHooks<TRoute, TContext, HookRemove, TRegister>['onBeforeRouteEnter']>
  ): ExternalRouteWithMethods<TRoute, TContext>,
}

export type ExternalRouteHooks<
  TRoute extends Route = Route,
  TContext extends RouteContext[] | undefined = undefined
> = {
  onBeforeRouteEnter: ExternalRouteHookMethod<TRoute, TContext>,
}
