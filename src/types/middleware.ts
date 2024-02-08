import { DeepReadonly, EffectScope } from 'vue'
import { RegisteredRouter, RegisteredRouterState } from '@/types/register'
import { Resolved } from '@/types/resolved'
import { Route } from '@/types/routes'
import { MaybePromise } from '@/types/utilities'
import { RegisteredRouterPush } from '@/utilities/createRouterPush'
import { RouterReject } from '@/utilities/createRouterReject'
import { RegisteredRouterReplace } from '@/utilities/createRouterReplace'

type MiddlewareContext = {
  from: DeepReadonly<Resolved<Route>> | null,
  // state: RegisteredRouterState,
  reject: RouterReject,
  push: RegisteredRouterPush,
  replace: RegisteredRouterReplace,
  // scope: EffectScope,
  // router: RegisteredRouter,
}

export type RouteMiddleware = (route: Resolved<Route>, context: MiddlewareContext) => MaybePromise<void>