import { ResolvedRoute } from '@/types/resolved'
import { MaybePromise } from '@/types/utilities'
import { RegisteredRouterPush } from '@/utilities/createRouterPush'
import { RouterReject } from '@/utilities/createRouterReject'
import { RegisteredRouterReplace } from '@/utilities/createRouterReplace'

export type AddRouteHook = (hook: RouteHook) => RouteHookRemove
export type RouteHookAbort = () => void

type RouteHookContext = {
  from: ResolvedRoute | null,
  // state: RegisteredRouterState,
  reject: RouterReject,
  push: RegisteredRouterPush,
  replace: RegisteredRouterReplace,
  // scope: EffectScope,
  // router: RegisteredRouter,
}

type BeforeRouteHookContext = RouteHookContext & {
  abort: RouteHookAbort,
}

type AfterRouteHookContext = RouteHookContext

export type BeforeRouteHook = (to: ResolvedRoute, context: BeforeRouteHookContext) => MaybePromise<void>
export type AfterRouteHook = (to: ResolvedRoute, context: AfterRouteHookContext) => MaybePromise<void>
export type RouteHook = (to: ResolvedRoute, context: RouteHookContext) => MaybePromise<void>
export type RouteHookRemove = () => void
export type RouteHookTiming = 'before' | 'after'
export type RouteHookLifeCycle = 'onBeforeRouteEnter' | 'onBeforeRouteLeave' | 'onBeforeRouteUpdate'
export type RouteHookCondition = (to: ResolvedRoute, from: ResolvedRoute | null, depth: number) => boolean