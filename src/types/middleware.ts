import { EffectScope } from 'vue'
import { RegisteredRejections, RegisteredRouter } from '@/types/register'
import { MaybePromise } from '@/types/utilities'

type Route = {
  name: string,
  params: Record<string, unknown>,
  query: unknown,
  hash: string,
}

export interface RouteState {

}

type RouteReject = (type?: RegisteredRejections) => void

type MiddlewareExtras = {
  from: Route | null,
  state: RouteState,
  reject: RouteReject,
  scope: EffectScope,
  router: RegisteredRouter,
}

export type RouteMiddleware = (route: Route, extras: MiddlewareExtras) => MaybePromise<void>