import { AnyHook } from '@/types/hook'
import { Hooks } from '@/models/hooks'
import { isResolvedRoute, RouterResolvedRouteUnion, ResolvedRouteUnion } from '@/types/resolved'
import { AnyFunction, MaybePromise } from '@/types/utilities'
import { isRoute, GenericRoute, GenericRoutes, Route, Routes } from '@/types/route'
import { RouterReject } from '@/types/routerReject'
import { RouterPush } from '@/types/routerPush'
import { RouterReplace } from '@/types/routerReplace'
import { isRejection, Rejection, Rejections } from '@/types/rejection'
import { ContextRejections, ContextRoutes, RegisteredContextRejections, RegisteredContextRoutes, RouteContext } from '@/types/routeContext'
import { RouterAbort } from '@/types/routerAbort'
import { RedirectHook } from '@/types/redirects'
import { CallbackContextAbort, CallbackContextPush, CallbackContextRedirect, CallbackContextReject, CallbackContextSuccess } from '@/types/callbackContext'
import { RouteUpdate } from '@/types/routeUpdate'
import { NavigationProgressTracker } from '@/services/createNavigationProgress'

export function getHooks(value: Record<string, unknown> | undefined | null): Hooks[] {
  return !!value && (isRoute(value) || isResolvedRoute(value) || isRejection(value)) ? value.hooks : []
}

export function combineHooks(parent: Route, child: Route): Hooks[] {
  return [...getHooks(parent), ...getHooks(child)]
}

export type InternalRouteHooks<
  TRoute extends Route = Route,
  TContext extends RouteContext[] | undefined = undefined,
  TReturn = HookRemove,
  TRegister = unknown
> = {
  /**
   * Registers a route hook to be called before the route is entered.
   */
  onBeforeRouteEnter: AddHook<BeforeEnterHook<[TRoute] | ContextRoutes<TContext, RegisteredContextRoutes<TRegister>>, ContextRejections<TContext, RegisteredContextRejections<TRegister>>, TRoute, Route>, TReturn>,
  /**
   * Registers a route hook to be called before the route is left.
   */
  onBeforeRouteLeave: AddHook<BeforeLeaveHook<[TRoute] | ContextRoutes<TContext, RegisteredContextRoutes<TRegister>>, ContextRejections<TContext, RegisteredContextRejections<TRegister>>, Route, TRoute>, TReturn>,
  /**
   * Registers a route hook to be called before the route is updated.
   */
  onBeforeRouteUpdate: AddHook<BeforeUpdateHook<[TRoute] | ContextRoutes<TContext, RegisteredContextRoutes<TRegister>>, ContextRejections<TContext, RegisteredContextRejections<TRegister>>, TRoute, Route>, TReturn>,
  /**
   * Registers a route hook to be called after the route is entered.
   */
  onAfterRouteEnter: AddHook<AfterEnterHook<[TRoute] | ContextRoutes<TContext, RegisteredContextRoutes<TRegister>>, ContextRejections<TContext, RegisteredContextRejections<TRegister>>, TRoute, Route>, TReturn>,
  /**
   * Registers a route hook to be called after the route is left.
   */
  onAfterRouteLeave: AddHook<AfterLeaveHook<[TRoute] | ContextRoutes<TContext, RegisteredContextRoutes<TRegister>>, ContextRejections<TContext, RegisteredContextRejections<TRegister>>, Route, TRoute>, TReturn>,
  /**
   * Registers a route hook to be called after the route is updated.
   */
  onAfterRouteUpdate: AddHook<AfterUpdateHook<[TRoute] | ContextRoutes<TContext, RegisteredContextRoutes<TRegister>>, ContextRejections<TContext, RegisteredContextRejections<TRegister>>, TRoute, Route>, TReturn>,
}

export type RejectionHooks<
  TRejections extends string = string
> = {
  /**
   * Registers a route hook to be called when a rejection occurs.
   */
  onRejection: AddRejectionHook<TRejections>,
}

export type HookTiming = 'global' | 'component'

export type BeforeHook = RedirectHook | BeforeEnterHook | BeforeUpdateHook | BeforeLeaveHook
export type AfterHook = AfterEnterHook | AfterUpdateHook | AfterLeaveHook

/**
 * Union type for all component route hooks.
 */
export type ComponentHook = BeforeEnterHook | BeforeUpdateHook | BeforeLeaveHook | AfterEnterHook | AfterUpdateHook | AfterLeaveHook

export type HookCallback = ComponentHook | RedirectHook | ErrorHook | RejectionHook

/**
 * Registration object for adding a component route hook.
 */
export type ComponentHookRegistrationOptions = HookRegistrationOptions & (
  | { lifecycle: 'onBeforeRouteEnter', hook: BeforeEnterHook | AnyHook }
  | { lifecycle: 'onBeforeRouteUpdate', hook: BeforeUpdateHook | AnyHook }
  | { lifecycle: 'onBeforeRouteLeave', hook: BeforeLeaveHook | AnyHook }
  | { lifecycle: 'onAfterRouteEnter', hook: AfterEnterHook | AnyHook }
  | { lifecycle: 'onAfterRouteUpdate', hook: AfterUpdateHook | AnyHook }
  | { lifecycle: 'onAfterRouteLeave', hook: AfterLeaveHook | AnyHook }
)

export type ComponentHookRegistration = ComponentHookRegistrationOptions & {
  depth: number,
}

/**
 * Function to add a component route hook with depth-based condition checking.
 */
export type AddComponentHook = (registration: ComponentHookRegistration) => HookRemove

export type AddGlobalHooks = (hooks: Hooks[]) => void

/**
 * A function to remove a previously added route hook.
 */
export type HookRemove = () => void

export type HookEntry<THook> = {
  hook: THook,
  remove: HookRemove,
}

export type HookRegistrationOptions = {
  /**
   * Removes the hook when aborted.
   */
  signal?: AbortSignal,
}

/**
 * Registers an inline callback or a reusable hook definition.
 */
export type AddHook<THook extends AnyFunction, TReturn = HookRemove> = (hook: THook | AnyHook, options?: HookRegistrationOptions) => TReturn

/**
 * Enumerates the lifecycle events for before route hooks.
 */
export type BeforeHookLifecycle = 'onBeforeRouteEnter' | 'onBeforeRouteUpdate' | 'onBeforeRouteLeave'

/**
 * Enumerates the lifecycle events for after route hooks.
 */
export type AfterHookLifecycle = 'onAfterRouteEnter' | 'onAfterRouteUpdate' | 'onAfterRouteLeave'

/**
 * Union type for all route hook lifecycle events.
 */
export type HookLifecycle = BeforeHookLifecycle | AfterHookLifecycle

export type AfterHookContext<
  TRoute extends GenericRoute,
  TRoutes extends GenericRoutes,
  TRejections extends Rejections
> = {
  lifecycle: 'after',
  remove: HookRemove,
  reject: RouterReject<TRejections>,
  push: RouterPush<TRoutes>,
  replace: RouterReplace<TRoutes>,
  update: RouteUpdate<ResolvedRouteUnion<TRoute>>,
  signal: AbortSignal,
}

export type BeforeHookContext<
  TRouteTo extends GenericRoute,
  TRoutes extends GenericRoutes,
  TRejections extends Rejections
> = {
  lifecycle: 'before',
  remove: HookRemove,
  reject: RouterReject<TRejections>,
  push: RouterPush<TRoutes>,
  replace: RouterReplace<TRoutes>,
  update: RouteUpdate<ResolvedRouteUnion<TRouteTo>>,
  abort: RouterAbort,
  signal: AbortSignal,
}

export type BeforeEnterHookContext<
  TRoutes extends GenericRoutes = Routes,
  TRejections extends Rejections = Rejections,
  TRouteTo extends GenericRoute = TRoutes[number],
  TRouteFrom extends GenericRoute = TRoutes[number]
> = BeforeHookContext<TRouteTo, TRoutes, TRejections> & {
  from: ResolvedRouteUnion<TRouteFrom> | null,
}

export type BeforeEnterHook<
  TRoutes extends GenericRoutes = Routes,
  TRejections extends Rejections = Rejections,
  TRouteTo extends GenericRoute = TRoutes[number],
  TRouteFrom extends GenericRoute = TRoutes[number]
> = (to: ResolvedRouteUnion<TRouteTo>, context: BeforeEnterHookContext<TRoutes, TRejections, TRouteTo, TRouteFrom>) => MaybePromise<void>

export type AddBeforeEnterHook<
  TRoutes extends GenericRoutes = Routes,
  TRejections extends Rejections = Rejections,
  TRouteTo extends GenericRoute = TRoutes[number],
  TRouteFrom extends GenericRoute = TRoutes[number]
> = AddHook<BeforeEnterHook<TRoutes, TRejections, TRouteTo, TRouteFrom>>

export type BeforeUpdateHookContext<
  TRoutes extends GenericRoutes = Routes,
  TRejections extends Rejections = Rejections,
  TRouteTo extends GenericRoute = TRoutes[number],
  TRouteFrom extends GenericRoute = TRoutes[number]
> = BeforeHookContext<TRouteTo, TRoutes, TRejections> & {
  from: ResolvedRouteUnion<TRouteFrom> | null,
}

export type BeforeUpdateHook<
  TRoutes extends GenericRoutes = Routes,
  TRejections extends Rejections = Rejections,
  TRouteTo extends GenericRoute = TRoutes[number],
  TRouteFrom extends GenericRoute = TRoutes[number]
> = (to: ResolvedRouteUnion<TRouteTo>, context: BeforeUpdateHookContext<TRoutes, TRejections, TRouteTo, TRouteFrom>) => MaybePromise<void>

export type AddBeforeUpdateHook<
  TRoutes extends GenericRoutes = Routes,
  TRejections extends Rejections = Rejections,
  TRouteTo extends GenericRoute = TRoutes[number],
  TRouteFrom extends GenericRoute = TRoutes[number]
> = AddHook<BeforeUpdateHook<TRoutes, TRejections, TRouteTo, TRouteFrom>>

export type BeforeLeaveHookContext<
  TRoutes extends GenericRoutes = Routes,
  TRejections extends Rejections = Rejections,
  TRouteTo extends GenericRoute = TRoutes[number],
  TRouteFrom extends GenericRoute = TRoutes[number]
> = Omit<BeforeHookContext<TRouteTo, TRoutes, TRejections>, 'update'> & {
  from: ResolvedRouteUnion<TRouteFrom>,
}

export type BeforeLeaveHook<
  TRoutes extends GenericRoutes = Routes,
  TRejections extends Rejections = Rejections,
  TRouteTo extends GenericRoute = TRoutes[number],
  TRouteFrom extends GenericRoute = TRoutes[number]
> = (to: ResolvedRouteUnion<TRouteTo> | null, context: BeforeLeaveHookContext<TRoutes, TRejections, TRouteTo, TRouteFrom>) => MaybePromise<void>

export type AddBeforeLeaveHook<
  TRoutes extends GenericRoutes = Routes,
  TRejections extends Rejections = Rejections,
  TRouteTo extends GenericRoute = TRoutes[number],
  TRouteFrom extends GenericRoute = TRoutes[number]
> = AddHook<BeforeLeaveHook<TRoutes, TRejections, TRouteTo, TRouteFrom>>

export type AfterEnterHookContext<
  TRoutes extends GenericRoutes = Routes,
  TRejections extends Rejections = Rejections,
  TRouteTo extends GenericRoute = TRoutes[number],
  TRouteFrom extends GenericRoute = TRoutes[number]
> = AfterHookContext<TRouteTo, TRoutes, TRejections> & {
  from: ResolvedRouteUnion<TRouteFrom> | null,
}

export type AfterEnterHook<
  TRoutes extends GenericRoutes = Routes,
  TRejections extends Rejections = Rejections,
  TRouteTo extends GenericRoute = TRoutes[number],
  TRouteFrom extends GenericRoute = TRoutes[number]
> = (to: ResolvedRouteUnion<TRouteTo>, context: AfterEnterHookContext<TRoutes, TRejections, TRouteTo, TRouteFrom>) => MaybePromise<void>

export type AddAfterEnterHook<
  TRoutes extends GenericRoutes = Routes,
  TRejections extends Rejections = Rejections,
  TRouteTo extends GenericRoute = TRoutes[number],
  TRouteFrom extends GenericRoute = TRoutes[number]
> = AddHook<AfterEnterHook<TRoutes, TRejections, TRouteTo, TRouteFrom>>

export type AfterUpdateHookContext<
  TRoutes extends GenericRoutes = Routes,
  TRejections extends Rejections = Rejections,
  TRouteTo extends GenericRoute = TRoutes[number],
  TRouteFrom extends GenericRoute = TRoutes[number]
> = AfterHookContext<TRouteTo, TRoutes, TRejections> & {
  from: ResolvedRouteUnion<TRouteFrom> | null,
}

export type AfterUpdateHook<
  TRoutes extends GenericRoutes = Routes,
  TRejections extends Rejections = Rejections,
  TRouteTo extends GenericRoute = TRoutes[number],
  TRouteFrom extends GenericRoute = TRoutes[number]
> = (to: ResolvedRouteUnion<TRouteTo>, context: AfterUpdateHookContext<TRoutes, TRejections, TRouteTo, TRouteFrom>) => MaybePromise<void>

export type AddAfterUpdateHook<
  TRoutes extends GenericRoutes = Routes,
  TRejections extends Rejections = Rejections,
  TRouteTo extends GenericRoute = TRoutes[number],
  TRouteFrom extends GenericRoute = TRoutes[number]
> = AddHook<AfterUpdateHook<TRoutes, TRejections, TRouteTo, TRouteFrom>>

export type AfterLeaveHookContext<
  TRoutes extends GenericRoutes = Routes,
  TRejections extends Rejections = Rejections,
  TRouteTo extends GenericRoute = TRoutes[number],
  TRouteFrom extends GenericRoute = TRoutes[number]
> = Omit<AfterHookContext<TRouteTo, TRoutes, TRejections>, 'update'> & {
  from: ResolvedRouteUnion<TRouteFrom>,
}

export type AfterLeaveHook<
  TRoutes extends GenericRoutes = Routes,
  TRejections extends Rejections = Rejections,
  TRouteTo extends GenericRoute = TRoutes[number],
  TRouteFrom extends GenericRoute = TRoutes[number]
> = (to: ResolvedRouteUnion<TRouteTo> | null, context: AfterLeaveHookContext<TRoutes, TRejections, TRouteTo, TRouteFrom>) => MaybePromise<void>

export type AddAfterLeaveHook<
  TRoutes extends GenericRoutes = Routes,
  TRejections extends Rejections = Rejections,
  TRouteTo extends GenericRoute = TRoutes[number],
  TRouteFrom extends GenericRoute = TRoutes[number]
> = AddHook<AfterLeaveHook<TRoutes, TRejections, TRouteTo, TRouteFrom>>

export type BeforeHookResponse = CallbackContextSuccess | CallbackContextPush | CallbackContextRedirect | CallbackContextReject | CallbackContextAbort
export type AfterHookResponse = CallbackContextSuccess | CallbackContextPush | CallbackContextReject

export type HookRunnerContext<TRoutes extends Routes = Routes> = {
  to: RouterResolvedRouteUnion<TRoutes> | null,
  from: RouterResolvedRouteUnion<TRoutes> | null,
  signal: AbortSignal,
}

export type BeforeHookRunner = <TRoutes extends Routes>(context: HookRunnerContext<TRoutes> & { progress?: NavigationProgressTracker }) => Promise<BeforeHookResponse>

export type AfterHookRunner = <TRoutes extends Routes>(context: HookRunnerContext<TRoutes>) => Promise<AfterHookResponse>

export type RejectionHookContext<
  TRoutes extends Routes = Routes,
  TRouteTo extends Route = TRoutes[number],
  TRouteFrom extends Route = TRoutes[number]
> = {
  remove: HookRemove,
  to: ResolvedRouteUnion<TRouteTo> | null,
  from: ResolvedRouteUnion<TRouteFrom> | null,
}

export type RejectionHook<
  TRejection extends string = string,
  TRoutes extends Routes = Routes,
  TRouteTo extends Route = TRoutes[number],
  TRouteFrom extends Route = TRoutes[number]
> = (rejection: TRejection, context: RejectionHookContext<TRoutes, TRouteTo, TRouteFrom>) => MaybePromise<void>

export type AddRejectionHook<
  TRejections extends string = string,
  TRoutes extends Routes = Routes,
  TRouteTo extends Route = TRoutes[number],
  TRouteFrom extends Route = TRoutes[number]
> = (hook: RejectionHook<TRejections, TRoutes, TRouteTo, TRouteFrom>, options?: HookRegistrationOptions) => HookRemove

export type RejectionHookRunner<TRejection extends Rejection = Rejection, TRoutes extends Routes = Routes> = (
  rejection: TRejection,
  context: { to: RouterResolvedRouteUnion<TRoutes> | null, from: RouterResolvedRouteUnion<TRoutes> | null },
) => void

export type ErrorHookContext<
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = {
  remove: HookRemove,
  to: RouterResolvedRouteUnion<TRoutes> | null,
  from: RouterResolvedRouteUnion<TRoutes> | null,
  source: 'props' | 'loader' | 'hook' | 'component',
  reject: RouterReject<TRejections>,
  push: RouterPush<TRoutes>,
  replace: RouterReplace<TRoutes>,
}

export type ErrorHook<
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = (error: unknown, context: ErrorHookContext<TRoutes, TRejections>) => void

export type AddErrorHook<
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = (hook: ErrorHook<TRoutes, TRejections>, options?: HookRegistrationOptions) => HookRemove

export type ErrorHookRunnerContext<TRoutes extends Routes = Routes> = {
  to: RouterResolvedRouteUnion<TRoutes> | null,
  from: RouterResolvedRouteUnion<TRoutes> | null,
  source: 'props' | 'loader' | 'hook',
}

export type ErrorHookRunner = (
  error: unknown,
  context: ErrorHookRunnerContext,
) => void
