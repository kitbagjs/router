import { AddRouterBeforeRouteHook, AddRouterAfterRouteHook, AddRouterErrorHook } from '@/types/hooks'
import { Routes } from '@/types/route'
import { RouterRouteHooks } from '@/models/RouterRouteHooks'
import { RouteContext, RouteContextToRejection, RouteContextToRoute } from '@/types/routeContext'
import { Rejection } from '@/types/rejection'

export type RouteHooks<
  TRoutes extends Routes,
  TRejections extends Rejection[]
> = {
  onBeforeRouteEnter: AddRouterBeforeRouteHook<TRoutes, TRejections>,
  onBeforeRouteUpdate: AddRouterBeforeRouteHook<TRoutes, TRejections>,
  onBeforeRouteLeave: AddRouterBeforeRouteHook<TRoutes, TRejections>,
  onAfterRouteEnter: AddRouterAfterRouteHook<TRoutes, TRejections>,
  onAfterRouteUpdate: AddRouterAfterRouteHook<TRoutes, TRejections>,
  onAfterRouteLeave: AddRouterAfterRouteHook<TRoutes, TRejections>,
  onError: AddRouterErrorHook<TRoutes, TRejections>,
  store: RouterRouteHooks,
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function createRouteHooks<TContext extends RouteContext[]>(_context: TContext): RouteHooks<
  RouteContextToRoute<TContext>,
  RouteContextToRejection<TContext>
> {
  type TRoutes = RouteContextToRoute<TContext>
  type TRejections = RouteContextToRejection<TContext>

  const store = new RouterRouteHooks()

  const onBeforeRouteEnter: AddRouterBeforeRouteHook<TRoutes, TRejections> = (hook) => {
    store.onBeforeRouteEnter.add(hook)

    return () => store.onBeforeRouteEnter.delete(hook)
  }

  const onBeforeRouteUpdate: AddRouterBeforeRouteHook<TRoutes, TRejections> = (hook) => {
    store.onBeforeRouteUpdate.add(hook)

    return () => store.onBeforeRouteUpdate.delete(hook)
  }

  const onBeforeRouteLeave: AddRouterBeforeRouteHook<TRoutes, TRejections> = (hook) => {
    store.onBeforeRouteLeave.add(hook)

    return () => store.onBeforeRouteLeave.delete(hook)
  }

  const onAfterRouteEnter: AddRouterAfterRouteHook<TRoutes, TRejections> = (hook) => {
    store.onAfterRouteEnter.add(hook)

    return () => store.onAfterRouteEnter.delete(hook)
  }

  const onAfterRouteUpdate: AddRouterAfterRouteHook<TRoutes, TRejections> = (hook) => {
    store.onAfterRouteUpdate.add(hook)

    return () => store.onAfterRouteUpdate.delete(hook)
  }

  const onAfterRouteLeave: AddRouterAfterRouteHook<TRoutes, TRejections> = (hook) => {
    store.onAfterRouteLeave.add(hook)

    return () => store.onAfterRouteLeave.delete(hook)
  }

  const onError: AddRouterErrorHook<TRoutes, TRejections> = (hook) => {
    store.onError.add(hook)

    return () => store.onError.delete(hook)
  }

  return {
    onBeforeRouteEnter,
    onBeforeRouteUpdate,
    onBeforeRouteLeave,
    onAfterRouteEnter,
    onAfterRouteUpdate,
    onAfterRouteLeave,
    onError,
    store,
  }
}
