import { AddBeforeEnterHook, AddBeforeUpdateHook, AddBeforeLeaveHook, AddAfterEnterHook, AddAfterUpdateHook, AddAfterLeaveHook, AddErrorHook, AddRedirectHook } from '@/types/hooks'
import { Routes } from '@/types/route'
import { Hooks } from '@/models/hooks'
import { Rejection } from '@/types/rejection'

export type RouteHooks<
  TRoutes extends Routes = Routes,
  TRejections extends Rejection[] = Rejection[]
> = {
  redirect: AddRedirectHook<TRoutes>,
  onBeforeRouteEnter: AddBeforeEnterHook<TRoutes, TRejections>,
  onBeforeRouteUpdate: AddBeforeUpdateHook<TRoutes, TRejections>,
  onBeforeRouteLeave: AddBeforeLeaveHook<TRoutes, TRejections>,
  onAfterRouteEnter: AddAfterEnterHook<TRoutes, TRejections>,
  onAfterRouteUpdate: AddAfterUpdateHook<TRoutes, TRejections>,
  onAfterRouteLeave: AddAfterLeaveHook<TRoutes, TRejections>,
  onError: AddErrorHook<TRoutes[number], TRoutes, TRejections>,
  store: Hooks,
}

export function createRouteHooks(): RouteHooks {
  const store = new Hooks()

  const redirect: AddRedirectHook = (hook) => {
    store.redirects.add(hook)

    return () => store.redirects.delete(hook)
  }

  const onBeforeRouteEnter: AddBeforeEnterHook = (hook) => {
    store.onBeforeRouteEnter.add(hook)

    return () => store.onBeforeRouteEnter.delete(hook)
  }

  const onBeforeRouteUpdate: AddBeforeUpdateHook = (hook) => {
    store.onBeforeRouteUpdate.add(hook)

    return () => store.onBeforeRouteUpdate.delete(hook)
  }

  const onBeforeRouteLeave: AddBeforeLeaveHook = (hook) => {
    store.onBeforeRouteLeave.add(hook)

    return () => store.onBeforeRouteLeave.delete(hook)
  }

  const onAfterRouteEnter: AddAfterEnterHook = (hook) => {
    store.onAfterRouteEnter.add(hook)

    return () => store.onAfterRouteEnter.delete(hook)
  }

  const onAfterRouteUpdate: AddAfterUpdateHook = (hook) => {
    store.onAfterRouteUpdate.add(hook)

    return () => store.onAfterRouteUpdate.delete(hook)
  }

  const onAfterRouteLeave: AddAfterLeaveHook = (hook) => {
    store.onAfterRouteLeave.add(hook)

    return () => store.onAfterRouteLeave.delete(hook)
  }

  const onError: AddErrorHook = (hook) => {
    store.onError.add(hook)

    return () => store.onError.delete(hook)
  }

  return {
    redirect,
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
