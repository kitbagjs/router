import { AddBeforeEnterHook, AddBeforeUpdateHook, AddBeforeLeaveHook, AddAfterEnterHook, AddAfterUpdateHook, AddAfterLeaveHook, AddErrorHook, AddTitleHook } from '@/types/hooks'
import { Routes } from '@/types/route'
import { Hooks } from '@/models/hooks'
import { Rejection } from '@/types/rejection'
import { RedirectHook, RouteRedirect } from '@/types/redirects'
import { MultipleRouteRedirectsError } from '@/errors/multipleRouteRedirectsError'

type RouteHooks<
  TRoutes extends Routes = Routes,
  TRejections extends Rejection[] = Rejection[]
> = {
  redirect: RouteRedirect,
  onBeforeRouteEnter: AddBeforeEnterHook<TRoutes, TRejections>,
  onBeforeRouteUpdate: AddBeforeUpdateHook<TRoutes, TRejections>,
  onBeforeRouteLeave: AddBeforeLeaveHook<TRoutes, TRejections>,
  onAfterRouteEnter: AddAfterEnterHook<TRoutes, TRejections>,
  onAfterRouteUpdate: AddAfterUpdateHook<TRoutes, TRejections>,
  onAfterRouteLeave: AddAfterLeaveHook<TRoutes, TRejections>,
  setTitle: AddTitleHook<TRoutes>,
  onError: AddErrorHook<TRoutes[number], TRoutes, TRejections>,
  store: Hooks,
}

export function createRouteHooks(): RouteHooks {
  const store = new Hooks()

  const redirect: RouteRedirect = (to, convertParams) => {
    if (store.redirects.size > 0) {
      throw new MultipleRouteRedirectsError(to.name)
    }

    const hook: RedirectHook = (from, { replace }) => {
      replace(to.name, convertParams?.(from.params))
    }

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

  const setTitle: AddTitleHook = (hook) => {
    store.setTitle.add(hook)

    return () => store.setTitle.delete(hook)
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
    setTitle,
    store,
  }
}
