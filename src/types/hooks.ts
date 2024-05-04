import { RouterRejectionType } from '@/services/createRouterReject'
import { RegisteredRouterPush, RegisteredRouterReplace } from '@/types/register'
import { ResolvedRoute } from '@/types/resolved'
import { Routes } from '@/types/route'
import { RouterReject } from '@/types/router'
import { RouterPush } from '@/types/routerPush'
import { MaybePromise } from '@/types/utilities'

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

type RouteHookPushResponse<T extends Routes> = {
  status: 'PUSH',
  to: Parameters<RouterPush<T>>,
}

type RouteHookRejectResponse = {
  status: 'REJECT',
  type: RouterRejectionType,
}

export type BeforeRouteHookResponse<T extends Routes> = RouteHookSuccessResponse | RouteHookPushResponse<T> | RouteHookRejectResponse | RouteHookAbortResponse
export type AfterRouteHookResponse<T extends Routes> = RouteHookSuccessResponse | RouteHookPushResponse<T> | RouteHookRejectResponse
export type RouteHookResponse<T extends Routes> = BeforeRouteHookResponse<T> | AfterRouteHookResponse<T>
