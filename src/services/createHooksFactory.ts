import { AddBeforeHook, AddAfterHook, AddErrorHook } from '@/types/hooks'
import { Routes } from '@/types/route'
import { Hooks } from '@/models/hooks'
import { Rejection } from '@/types/rejection'

export type RouteHooks<
  TRoutes extends Routes = Routes,
  TRejections extends Rejection[] = Rejection[]
> = {
  onBeforeRouteEnter: AddBeforeHook<TRoutes[number], TRoutes, TRejections>,
  onBeforeRouteUpdate: AddBeforeHook<TRoutes[number], TRoutes, TRejections>,
  onBeforeRouteLeave: AddBeforeHook<TRoutes[number], TRoutes, TRejections>,
  onAfterRouteEnter: AddAfterHook<TRoutes[number], TRoutes, TRejections>,
  onAfterRouteUpdate: AddAfterHook<TRoutes[number], TRoutes, TRejections>,
  onAfterRouteLeave: AddAfterHook<TRoutes[number], TRoutes, TRejections>,
  onError: AddErrorHook<TRoutes[number], TRoutes, TRejections>,
  store: Hooks,
}

export function createHooksFactory(): RouteHooks {
  const store = new Hooks()

  const onBeforeRouteEnter: AddBeforeHook = (hook) => {
    store.onBeforeRouteEnter.add(hook)

    return () => store.onBeforeRouteEnter.delete(hook)
  }

  const onBeforeRouteUpdate: AddBeforeHook = (hook) => {
    store.onBeforeRouteUpdate.add(hook)

    return () => store.onBeforeRouteUpdate.delete(hook)
  }

  const onBeforeRouteLeave: AddBeforeHook = (hook) => {
    store.onBeforeRouteLeave.add(hook)

    return () => store.onBeforeRouteLeave.delete(hook)
  }

  const onAfterRouteEnter: AddAfterHook = (hook) => {
    store.onAfterRouteEnter.add(hook)

    return () => store.onAfterRouteEnter.delete(hook)
  }

  const onAfterRouteUpdate: AddAfterHook = (hook) => {
    store.onAfterRouteUpdate.add(hook)

    return () => store.onAfterRouteUpdate.delete(hook)
  }

  const onAfterRouteLeave: AddAfterHook = (hook) => {
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
