import { MaybePromise } from '@/types/utilities'
import { RegisteredRouterPush } from '@/utilities/createRouterPush'
import { RouterReject } from '@/utilities/createRouterReject'
import { RegisteredRouterReplace } from '@/utilities/createRouterReplace'
import { RouterRoute } from '@/utilities/createRouterRoute'

type MiddlewareContext = {
  from: RouterRoute | null,
  // state: RegisteredRouterState,
  reject: RouterReject,
  push: RegisteredRouterPush,
  replace: RegisteredRouterReplace,
  // scope: EffectScope,
  // router: RegisteredRouter,
}

export type RouteMiddleware = (to: RouterRoute, context: MiddlewareContext) => MaybePromise<void>
