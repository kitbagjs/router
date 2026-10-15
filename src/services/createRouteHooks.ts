import { ComponentHook, HookRemove, AddBeforeEnterHook, AddBeforeUpdateHook, AddBeforeLeaveHook, AddAfterEnterHook, AddAfterUpdateHook, AddAfterLeaveHook, AddErrorHook, AddRejectionHook } from '@/types/hooks'
import { isHook } from '@/types/hook'
import { Routes } from '@/types/route'
import { Hooks } from '@/models/hooks'
import { ExtractRejectionTypes, Rejection } from '@/types/rejection'
import { RedirectHook, RouteRedirect } from '@/types/redirects'
import { ContextRedirectError } from '@/errors/contextRedirectError'
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
  onError: AddErrorHook<TRoutes, TRejections>,
  onRejection: AddRejectionHook<ExtractRejectionTypes<TRejections>, TRoutes>,
  store: Hooks,
}

export function createRouteHooks(): RouteHooks {
  const store = new Hooks()

  const redirect: RouteRedirect = (to, convertParams, options) => {
    if (store.redirects.size > 0) {
      throw new MultipleRouteRedirectsError(to.name)
    }

    const hook: RedirectHook = (from, { redirectStatus }) => {
      throw new ContextRedirectError([to.name, convertParams?.(from.params), { replace: true, redirectStatus: options?.status ?? redirectStatus }])
    }

    store.redirects.add(hook)

    return () => store.redirects.delete(hook)
  }

  function addHook<THook extends ComponentHook>(hooks: Set<THook>, hook: THook): HookRemove {
    for (const callback of store.onHookAdded) {
      callback(hook)
    }

    if (isHook(hook)) {
      store.context.push(...hook.context)
    }

    hooks.add(hook)

    return () => hooks.delete(hook)
  }

  const onBeforeRouteEnter: AddBeforeEnterHook = (hook) => {
    return addHook(store.onBeforeRouteEnter, hook)
  }

  const onBeforeRouteUpdate: AddBeforeUpdateHook = (hook) => {
    return addHook(store.onBeforeRouteUpdate, hook)
  }

  const onBeforeRouteLeave: AddBeforeLeaveHook = (hook) => {
    return addHook(store.onBeforeRouteLeave, hook)
  }

  const onAfterRouteEnter: AddAfterEnterHook = (hook) => {
    return addHook(store.onAfterRouteEnter, hook)
  }

  const onAfterRouteUpdate: AddAfterUpdateHook = (hook) => {
    return addHook(store.onAfterRouteUpdate, hook)
  }

  const onAfterRouteLeave: AddAfterLeaveHook = (hook) => {
    return addHook(store.onAfterRouteLeave, hook)
  }

  const onError: AddErrorHook = (hook) => {
    store.onError.add(hook)

    return () => store.onError.delete(hook)
  }

  const onRejection: AddRejectionHook = (hook) => {
    store.onRejection.add(hook)

    return () => store.onRejection.delete(hook)
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
    onRejection,
    store,
  }
}
