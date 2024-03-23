import { ResolvedRoute } from '@/types/resolved'
import { RouterReject } from '@/types/router'
import { RegisteredRouterPush, RouterPushImplementation } from '@/types/routerPush'
import { RegisteredRouterReplace } from '@/types/routerReplace'
import { MaybePromise } from '@/types/utilities'
import { RouterRejectionType } from '@/utilities/createRouterReject'

export type AddBeforeRouteHook = (hook: BeforeRouteHook) => RouteHookRemove
export type AddAfterRouteHook = (hook: AfterRouteHook) => RouteHookRemove
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
export type RouteHook = BeforeRouteHook | AfterRouteHook
export type RouteHookRemove = () => void

export type BeforeRouteHookLifecycle = 'onBeforeRouteEnter' | 'onBeforeRouteUpdate' |'onBeforeRouteLeave'
export type AfterRouteHookLifecycle = 'onAfterRouteEnter' | 'onAfterRouteUpdate' | 'onAfterRouteLeave'
export type RouteHookLifecycle = BeforeRouteHookLifecycle | AfterRouteHookLifecycle

type RouteHookSuccessResponse = {
  status: 'SUCCESS',
}

type RouteHookAbortResponse = {
  status: 'ABORT',
}

type RouteHookPushResponse = {
  status: 'PUSH',
  to: Parameters<RouterPushImplementation>,
}

type RouteHookRejectResponse = {
  status: 'REJECT',
  type: RouterRejectionType,
}

export type BeforeRouteHookResponse = RouteHookSuccessResponse | RouteHookPushResponse | RouteHookRejectResponse | RouteHookAbortResponse
export type AfterRouteHookResponse = RouteHookSuccessResponse | RouteHookPushResponse | RouteHookRejectResponse
export type RouteHookResponse = BeforeRouteHookResponse | AfterRouteHookResponse
