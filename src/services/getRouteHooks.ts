import { ResolvedRoute } from '@/types/resolved'
import { isRouteEnter, isRouteLeave, isRouteUpdate } from '@/services/hooks'
import { Hooks } from '@/models/hooks'
import { AfterHook, BeforeHook } from '@/types/hooks'

function wrapHookCatch(route: ResolvedRoute | null): <T extends BeforeHook | AfterHook>(hook: T) => T {
  const hooks = route?.hooks.flatMap((store) => Array.from(store.onError)) ?? []

  if (!hooks.length) {
    return (hook) => hook
  }

  return <T extends BeforeHook | AfterHook>(hook: T): T => ((to: any, context: any) => {
    try {
      return hook(to, context)
    } catch (error) {
      hooks.forEach((runErrorHook) => runErrorHook(error, { ...context, to, source: 'hook' }))
    }
  }) as T
}

export function getBeforeHooksFromRoutes(to: ResolvedRoute, from: ResolvedRoute | null): Hooks {
  const hooks = new Hooks()
  const toErrorWrapper = wrapHookCatch(to)
  const fromErrorWrapper = wrapHookCatch(from)

  to.hooks.forEach((store, depth) => {
    if (isRouteEnter(to, from, depth)) {
      return store.onBeforeRouteEnter.forEach((hook) => hooks.onBeforeRouteEnter.add(toErrorWrapper(hook)))
    }

    if (isRouteUpdate(to, from, depth)) {
      return store.onBeforeRouteUpdate.forEach((hook) => hooks.onBeforeRouteUpdate.add(toErrorWrapper(hook)))
    }
  })

  from?.hooks.forEach((store, depth) => {
    if (isRouteLeave(to, from, depth)) {
      return store.onBeforeRouteLeave.forEach((hook) => hooks.onBeforeRouteLeave.add(fromErrorWrapper(hook)))
    }
  })

  return hooks
}

export function getAfterHooksFromRoutes(to: ResolvedRoute, from: ResolvedRoute | null): Hooks {
  const hooks = new Hooks()
  const toErrorWrapper = wrapHookCatch(to)
  const fromErrorWrapper = wrapHookCatch(from)

  to.hooks.forEach((store, depth) => {
    if (isRouteEnter(to, from, depth)) {
      return store.onAfterRouteEnter.forEach((hook) => hooks.onAfterRouteEnter.add(toErrorWrapper(hook)))
    }

    if (isRouteUpdate(to, from, depth)) {
      return store.onAfterRouteUpdate.forEach((hook) => hooks.onAfterRouteUpdate.add(toErrorWrapper(hook)))
    }
  })

  from?.hooks.forEach((store, depth) => {
    if (isRouteLeave(to, from, depth)) {
      return store.onAfterRouteLeave.forEach((hook) => hooks.onAfterRouteLeave.add(fromErrorWrapper(hook)))
    }
  })

  return hooks
}
