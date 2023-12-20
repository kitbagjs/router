import { EffectScope } from 'vue'
import { MaybePromise } from '@/types/utilities'

type Route = {
  name: string,
  params: Record<string, unknown>,
  query: unknown,
  hash: string,
}

interface RouteState {

}

interface RouteRejection {
  NotFound: unknown,
}

type RouteReject = (type?: keyof RouteRejection) => void

type MiddlewareExtras = {
  from: Route | null,
  state: RouteState,
  reject: RouteReject,
  scope: EffectScope,
}

export type RouteMiddleware = (route: Route, extras: MiddleWareExtras) => MaybePromise<void>