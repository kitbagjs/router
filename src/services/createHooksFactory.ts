import { AddBeforeEnterHook, AddBeforeUpdateHook, AddBeforeLeaveHook, AddAfterEnterHook, AddAfterUpdateHook, AddAfterLeaveHook, AddErrorHook } from '@/types/hooks'
import { Routes } from '@/types/route'
import { Hooks } from '@/models/hooks'
import { Rejection } from '@/types/rejection'

export type RouteHooks<
  TRoutes extends Routes = Routes,
  TRejections extends Rejection[] = Rejection[]
> = {
  onBeforeRouteEnter: AddBeforeEnterHook<TRoutes[number], TRoutes[number], TRoutes, TRejections>,
  onBeforeRouteUpdate: AddBeforeUpdateHook<TRoutes[number], TRoutes[number], TRoutes, TRejections>,
  onBeforeRouteLeave: AddBeforeLeaveHook<TRoutes[number], TRoutes[number], TRoutes, TRejections>,
  onAfterRouteEnter: AddAfterEnterHook<TRoutes[number], TRoutes[number], TRoutes, TRejections>,
  onAfterRouteUpdate: AddAfterUpdateHook<TRoutes[number], TRoutes[number], TRoutes, TRejections>,
  onAfterRouteLeave: AddAfterLeaveHook<TRoutes[number], TRoutes[number], TRoutes, TRejections>,
  onError: AddErrorHook<TRoutes[number], TRoutes, TRejections>,
  store: Hooks,
}

export function createHooksFactory(): RouteHooks {
  const store = new Hooks()

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
