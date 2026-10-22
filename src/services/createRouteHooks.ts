import { AnyHook } from '@/types/hook'
import { ComponentHook, HookRemove, HookRegistrationOptions, AddBeforeEnterHook, AddBeforeUpdateHook, AddBeforeLeaveHook, AddAfterEnterHook, AddAfterUpdateHook, AddAfterLeaveHook, AddErrorHook, AddRejectionHook } from '@/types/hooks'
import { registerHook } from '@/services/registerHook'
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

  function addHook<THook extends ComponentHook | AnyHook>(hooks: Set<THook>, hook: THook, options?: HookRegistrationOptions): HookRemove {
    if (options?.signal?.aborted) {
      return () => {}
    }

    for (const callback of store.onHookAdded) {
      callback(hook)
    }

    return registerHook(hooks, hook, options)
  }

  const onBeforeRouteEnter: AddBeforeEnterHook = (hook, options) => {
    return addHook(store.onBeforeRouteEnter, hook, options)
  }

  const onBeforeRouteUpdate: AddBeforeUpdateHook = (hook, options) => {
    return addHook(store.onBeforeRouteUpdate, hook, options)
  }

  const onBeforeRouteLeave: AddBeforeLeaveHook = (hook, options) => {
    return addHook(store.onBeforeRouteLeave, hook, options)
  }

  const onAfterRouteEnter: AddAfterEnterHook = (hook, options) => {
    return addHook(store.onAfterRouteEnter, hook, options)
  }

  const onAfterRouteUpdate: AddAfterUpdateHook = (hook, options) => {
    return addHook(store.onAfterRouteUpdate, hook, options)
  }

  const onAfterRouteLeave: AddAfterLeaveHook = (hook, options) => {
    return addHook(store.onAfterRouteLeave, hook, options)
  }

  const onError: AddErrorHook = (hook, options) => {
    return registerHook(store.onError, hook, options)
  }

  const onRejection: AddRejectionHook = (hook, options) => {
    return registerHook(store.onRejection, hook, options)
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
