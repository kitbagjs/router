import { EffectScope } from 'vue'
import { RegisteredRouter } from '@/types/register'
import { MaybePromise } from '@/types/utilities'
import { RouterReject } from '@/utilities/createRouterReject'

type Route = {
  name: string,
  params: Record<string, unknown>,
  query: unknown,
  hash: string,
}

export interface RouteState {

}

type MiddlewareExtras = {
  from: Route | null,
  state: RouteState,
  reject: RouterReject,
  scope: EffectScope,
  router: RegisteredRouter,
}

export type RouteMiddleware = (route: Route, extras: MiddlewareExtras) => MaybePromise<void>