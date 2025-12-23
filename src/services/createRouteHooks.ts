import { AddRouterBeforeRouteHook, AddRouterAfterRouteHook, AddRouterErrorHook } from '@/types/hooks'
import { Routes } from '@/types/route'
import { RouterRouteHooks } from '@/models/RouterRouteHooks'
import { Rejection } from '@/types/rejection'

export type RouteHooks<
  TRoutes extends Routes = Routes,
  TRejections extends Rejection[] = Rejection[]
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

export function createRouteHooks(): RouteHooks {
  const store = new RouterRouteHooks()

  const onBeforeRouteEnter: AddRouterBeforeRouteHook = (hook) => {
    store.onBeforeRouteEnter.add(hook)

    return () => store.onBeforeRouteEnter.delete(hook)
  }

  const onBeforeRouteUpdate: AddRouterBeforeRouteHook = (hook) => {
    store.onBeforeRouteUpdate.add(hook)

    return () => store.onBeforeRouteUpdate.delete(hook)
  }

  const onBeforeRouteLeave: AddRouterBeforeRouteHook = (hook) => {
    store.onBeforeRouteLeave.add(hook)

    return () => store.onBeforeRouteLeave.delete(hook)
  }

  const onAfterRouteEnter: AddRouterAfterRouteHook = (hook) => {
    store.onAfterRouteEnter.add(hook)

    return () => store.onAfterRouteEnter.delete(hook)
  }

  const onAfterRouteUpdate: AddRouterAfterRouteHook = (hook) => {
    store.onAfterRouteUpdate.add(hook)

    return () => store.onAfterRouteUpdate.delete(hook)
  }

  const onAfterRouteLeave: AddRouterAfterRouteHook = (hook) => {
    store.onAfterRouteLeave.add(hook)

    return () => store.onAfterRouteLeave.delete(hook)
  }

  const onError: AddRouterErrorHook = (hook) => {
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
