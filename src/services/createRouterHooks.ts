import { InjectionKey } from 'vue'
import { AddAfterRouteHook, AddBeforeRouteHook, AddGlobalRouteHooks, AfterHookContext, AfterRouteHook, AfterRouteHookResponse, BeforeHookContext, BeforeRouteHook, BeforeRouteHookResponse, AddComponentAfterRouteHook, ComponentBeforeRouteHook, RouteHookAfterRunner, RouteHookBeforeRunner } from '@/types/hooks'
import { createCallbackContext } from './createCallbackContext'
import { RouteHooks } from '@/models/RouteHooks'
import { getRouteHookCondition } from './hooks'
import { getAfterRouteHooksFromRoutes, getBeforeRouteHooksFromRoutes } from './getRouteHooks'
import { CallbackContextPushError } from '@/errors/callbackContextPushError'
import { CallbackContextRejectionError } from '@/errors/callbackContextRejectionError'
import { CallbackContextAbortError } from '@/errors/callbackContextAbortError'
import { getGlobalAfterRouteHooks, getGlobalBeforeRouteHooks } from './getGlobalRouteHooks'

export const routerHooksKey: InjectionKey<RouterHooks> = Symbol()

export type RouterHooks = {
  runBeforeRouteHooks: RouteHookBeforeRunner,
  runAfterRouteHooks: RouteHookAfterRunner,
  addComponentBeforeRouteHook: ComponentBeforeRouteHook,
  addComponentAfterRouteHook: AddComponentAfterRouteHook,
  addGlobalRouteHooks: AddGlobalRouteHooks,
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
    store.global.onBeforeRouteEnter.add(hook)

    return () => store.global.onBeforeRouteEnter.delete(hook)
  }

  const onBeforeRouteUpdate: AddBeforeRouteHook = (hook) => {
    store.global.onBeforeRouteUpdate.add(hook)

    return () => store.global.onBeforeRouteUpdate.delete(hook)
  }

  const onBeforeRouteLeave: AddBeforeRouteHook = (hook) => {
    store.global.onBeforeRouteLeave.add(hook)

    return () => store.global.onBeforeRouteLeave.delete(hook)
  }

  const onAfterRouteEnter: AddAfterRouteHook = (hook) => {
    store.global.onAfterRouteEnter.add(hook)

    return () => store.global.onAfterRouteEnter.delete(hook)
  }

  const onAfterRouteUpdate: AddAfterRouteHook = (hook) => {
    store.global.onAfterRouteUpdate.add(hook)

    return () => store.global.onAfterRouteUpdate.delete(hook)
  }

  const onAfterRouteLeave: AddAfterRouteHook = (hook) => {
    store.global.onAfterRouteLeave.add(hook)

    return () => store.global.onAfterRouteLeave.delete(hook)
  }

  async function runBeforeRouteHooks({ to, from }: BeforeHookContext): Promise<BeforeRouteHookResponse> {
    const { global, component } = store
    const route = getBeforeRouteHooksFromRoutes(to, from)
    const globalHooks = getGlobalBeforeRouteHooks(to, from, global)

    const allHooks: BeforeRouteHook[] = [
      ...globalHooks.onBeforeRouteEnter,
      ...route.onBeforeRouteEnter,
      ...globalHooks.onBeforeRouteUpdate,
      ...route.onBeforeRouteUpdate,
      ...component.onBeforeRouteUpdate,
      ...globalHooks.onBeforeRouteLeave,
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
    const globalHooks = getGlobalAfterRouteHooks(to, from, global)

    const allHooks: AfterRouteHook[] = [
      ...component.onAfterRouteLeave,
      ...route.onAfterRouteLeave,
      ...globalHooks.onAfterRouteLeave,
      ...component.onAfterRouteUpdate,
      ...route.onAfterRouteUpdate,
      ...globalHooks.onAfterRouteUpdate,
      ...component.onAfterRouteEnter,
      ...route.onAfterRouteEnter,
      ...globalHooks.onAfterRouteEnter,
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

  const addComponentBeforeRouteHook: ComponentBeforeRouteHook = ({ lifecycle, depth, hook }) => {
    const condition = getRouteHookCondition(lifecycle)
    const hooks = store.component[lifecycle]

    const wrapped: BeforeRouteHook = (to, context) => {
      if (!condition(to, context.from, depth)) {
        return
      }

      return hook(to, context)
    }

    hooks.add(wrapped)

    return () => hooks.delete(wrapped)
  }

  const addComponentAfterRouteHook: AddComponentAfterRouteHook = ({ lifecycle, depth, hook }) => {
    const condition = getRouteHookCondition(lifecycle)
    const hooks = store.component[lifecycle]

    const wrapped: AfterRouteHook = (to, context) => {
      if (!condition(to, context.from, depth)) {
        return
      }

      return hook(to, context)
    }

    hooks.add(wrapped)

    return () => hooks.delete(wrapped)
  }

  const addGlobalRouteHooks: AddGlobalRouteHooks = (hooks) => {
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
    addComponentBeforeRouteHook,
    addComponentAfterRouteHook,
    addGlobalRouteHooks,
    onBeforeRouteEnter,
    onBeforeRouteUpdate,
    onBeforeRouteLeave,
    onAfterRouteEnter,
    onAfterRouteUpdate,
    onAfterRouteLeave,
  }
}
