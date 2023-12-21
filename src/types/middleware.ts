import { EffectScope } from 'vue'
import { MaybePromise } from '@/types/utilities'
import { Router } from '@/utilities'

type Route = {
  name: string,
  params: Record<string, unknown>,
  query: unknown,
  hash: string,
}

export interface RouteState {

}

export interface RouteRejection {
  NotFound: unknown,
}

type RouteReject = (type?: keyof RouteRejection) => void

type MiddlewareExtras = {
  from: Route | null,
  state: RouteState,
  reject: RouteReject,
  scope: EffectScope,
  router: Omit<Router<[]>, 'routes'> & { routes: Record<string, any> },
}

export type RouteMiddleware = (route: Route, extras: MiddlewareExtras) => MaybePromise<void>