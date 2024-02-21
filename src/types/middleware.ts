import { ResolvedRoute } from '@/types/resolved'
import { MaybePromise } from '@/types/utilities'
import { RegisteredRouterPush } from '@/utilities/createRouterPush'
import { RouterReject } from '@/utilities/createRouterReject'
import { RegisteredRouterReplace } from '@/utilities/createRouterReplace'

type MiddlewareContext = {
  from: ResolvedRoute | null,
  // state: RegisteredRouterState,
  reject: RouterReject,
  push: RegisteredRouterPush,
  replace: RegisteredRouterReplace,
  // scope: EffectScope,
  // router: RegisteredRouter,
}

export type RouteMiddleware = (to: ResolvedRoute, context: MiddlewareContext) => MaybePromise<void>
