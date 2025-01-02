import { InjectionKey } from 'vue'
import { AddAfterRouteHook, AddBeforeRouteHook, AddRouteHooks, AfterHookContext, AfterRouteHook, AfterRouteHookResponse, BeforeHookContext, BeforeRouteHook, BeforeRouteHookResponse, RegisterAfterRouteHook, RegisterBeforeRouteHook, RouteHookAfterRunner, RouteHookBeforeRunner } from '@/types/hooks'
import { createCallbackContext } from './createCallbackContext'
import { RouteHooks } from '@/models/RouteHooks'
import { getRouteHookCondition } from './hooks'
import { getAfterRouteHooksFromRoutes, getBeforeRouteHooksFromRoutes } from './getRouteHooks'
import { CallbackContextPushError } from '@/errors/callbackContextPushError'
import { CallbackContextRejectionError } from '@/errors/callbackContextRejectionError'
import { CallbackContextAbortError } from '@/errors/callbackContextAbortError'

export const routerHooksKey: InjectionKey<RouterHooks> = Symbol()

export type RouterHooks = {
  runBeforeRouteHooks: RouteHookBeforeRunner,
  runAfterRouteHooks: RouteHookAfterRunner,
  addBeforeRouteHook: RegisterBeforeRouteHook,
  addAfterRouteHook: RegisterAfterRouteHook,
  addRouteHooks: AddRouteHooks,
  onBeforeRouteEnter: AddBeforeRouteHook,
  onBeforeRouteUpdate: AddBeforeRouteHook,
  onBeforeRouteLeave: AddBeforeRouteHook,
  onAfterRouteEnter: AddAfterRouteHook,
  onAfterRouteUpdate: AddAfterRouteHook,
  onAfterRouteLeave: AddAfterRouteHook,
}

export function createRouterHooks(): RouterHooks {
  const store = {
    global: new RouteHooks(),
    component: new RouteHooks(),
  }

  const { reject, push, replace, abort } = createCallbackContext()

  const onBeforeRouteEnter: AddBeforeRouteHook = (hook) => {
    return addBeforeRouteHook({ lifecycle: 'onBeforeRouteEnter', hook, timing: 'global', depth: 0 })
  }

  const onBeforeRouteUpdate: AddBeforeRouteHook = (hook) => {
    return addBeforeRouteHook({ lifecycle: 'onBeforeRouteUpdate', hook, timing: 'global', depth: 0 })
  }

  const onBeforeRouteLeave: AddBeforeRouteHook = (hook) => {
    return addBeforeRouteHook({ lifecycle: 'onBeforeRouteLeave', hook, timing: 'global', depth: 0 })
  }

  const onAfterRouteEnter: AddAfterRouteHook = (hook) => {
    return addAfterRouteHook({ lifecycle: 'onAfterRouteEnter', hook, timing: 'global', depth: 0 })
  }

  const onAfterRouteUpdate: AddAfterRouteHook = (hook) => {
    return addAfterRouteHook({ lifecycle: 'onAfterRouteUpdate', hook, timing: 'global', depth: 0 })
  }

  const onAfterRouteLeave: AddAfterRouteHook = (hook) => {
    return addAfterRouteHook({ lifecycle: 'onAfterRouteLeave', hook, timing: 'global', depth: 0 })
  }

  async function runBeforeRouteHooks({ to, from }: BeforeHookContext): Promise<BeforeRouteHookResponse> {
    const { global, component } = store
    const route = getBeforeRouteHooksFromRoutes(to, from)

    const allHooks: BeforeRouteHook[] = [
      ...global.onBeforeRouteEnter,
      ...route.onBeforeRouteEnter,
      ...global.onBeforeRouteUpdate,
      ...route.onBeforeRouteUpdate,
      ...component.onBeforeRouteUpdate,
      ...global.onBeforeRouteLeave,
      ...route.onBeforeRouteLeave,
      ...component.onBeforeRouteLeave,
    ]

    try {
      const results = allHooks.map((callback) => callback(to, {
        from,
        reject,
        push,
        replace,
        abort,
      }))

      await Promise.all(results)
    } catch (error) {
      if (error instanceof CallbackContextPushError) {
        return error.response
      }

      if (error instanceof CallbackContextRejectionError) {
        return error.response
      }

      if (error instanceof CallbackContextAbortError) {
        return error.response
      }

      throw error
    }

    return {
      status: 'SUCCESS',
    }
  }

  async function runAfterRouteHooks({ to, from }: AfterHookContext): Promise<AfterRouteHookResponse> {
    const { global, component } = store
    const route = getAfterRouteHooksFromRoutes(to, from)

    const allHooks: AfterRouteHook[] = [
      ...component.onAfterRouteLeave,
      ...route.onAfterRouteLeave,
      ...global.onAfterRouteLeave,
      ...component.onAfterRouteUpdate,
      ...route.onAfterRouteUpdate,
      ...global.onAfterRouteUpdate,
      ...component.onAfterRouteEnter,
      ...route.onAfterRouteEnter,
      ...global.onAfterRouteEnter,
    ]

    try {
      const results = allHooks.map((callback) => callback(to, {
        from,
        reject,
        push,
        replace,
      }))

      await Promise.all(results)
    } catch (error) {
      if (error instanceof CallbackContextPushError) {
        return error.response
      }

      if (error instanceof CallbackContextRejectionError) {
        return error.response
      }

      throw error
    }

    return {
      status: 'SUCCESS',
    }
  }

  const addBeforeRouteHook: RegisterBeforeRouteHook = ({ lifecycle, timing, depth, hook }) => {
    const condition = getRouteHookCondition(lifecycle)
    const hooks = store[timing][lifecycle]

    const wrapped: BeforeRouteHook = (to, context) => {
      if (!condition(to, context.from, depth)) {
        return
      }

      return hook(to, context)
    }

    hooks.add(wrapped)

    return () => hooks.delete(wrapped)
  }

  const addAfterRouteHook: RegisterAfterRouteHook = ({ lifecycle, timing, depth, hook }) => {
    const condition = getRouteHookCondition(lifecycle)
    const hooks = store[timing][lifecycle]

    const wrapped: AfterRouteHook = (to, context) => {
      if (!condition(to, context.from, depth)) {
        return
      }

      return hook(to, context)
    }

    hooks.add(wrapped)

    return () => hooks.delete(wrapped)
  }

  const addRouteHooks: AddRouteHooks = (hooks) => {
    hooks.onBeforeRouteEnter.forEach((hook) => onBeforeRouteEnter(hook))
    hooks.onBeforeRouteUpdate.forEach((hook) => onBeforeRouteUpdate(hook))
    hooks.onBeforeRouteLeave.forEach((hook) => onBeforeRouteLeave(hook))
    hooks.onAfterRouteEnter.forEach((hook) => onAfterRouteEnter(hook))
    hooks.onAfterRouteUpdate.forEach((hook) => onAfterRouteUpdate(hook))
    hooks.onAfterRouteLeave.forEach((hook) => onAfterRouteLeave(hook))
  }

  return {
    runBeforeRouteHooks,
    runAfterRouteHooks,
    addBeforeRouteHook,
    addAfterRouteHook,
    addRouteHooks,
    onBeforeRouteEnter,
    onBeforeRouteUpdate,
    onBeforeRouteLeave,
    onAfterRouteEnter,
    onAfterRouteUpdate,
    onAfterRouteLeave,
  }
}
