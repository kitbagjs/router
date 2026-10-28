import { InjectionKey, onUnmounted } from 'vue'
import { createUseRouterDepth } from '@/compositions/useRouterDepth'
import { createUseRouterHooks } from '@/compositions/useRouterHooks'
import { AddBeforeUpdateHook, AddBeforeLeaveHook, AddAfterUpdateHook, AddAfterLeaveHook, ComponentHookRegistrationOptions, HookRemove } from '@/types/hooks'
import { Routes } from '@/types/route'
import { Router, RouterRejections, RouterRoutes } from '@/types/router'
import { Rejections } from '@/types/rejection'

type ComponentHooks<
  TRoutes extends Routes,
  TRejections extends Rejections
> = {
  onBeforeRouteLeave: AddBeforeLeaveHook<TRoutes, TRejections>,
  onBeforeRouteUpdate: AddBeforeUpdateHook<TRoutes, TRejections>,
  onAfterRouteLeave: AddAfterLeaveHook<TRoutes, TRejections>,
  onAfterRouteUpdate: AddAfterUpdateHook<TRoutes, TRejections>,
}

export function createComponentHooks<TRouter extends Router>(routerKey: InjectionKey<TRouter>): ComponentHooks<RouterRoutes<TRouter>, RouterRejections<TRouter>>
export function createComponentHooks(routerKey: symbol): ComponentHooks<Routes, Rejections> {
  const useRouterDepth = createUseRouterDepth(routerKey)
  const useRouterHooks = createUseRouterHooks(routerKey)

  function addHook(registration: ComponentHookRegistrationOptions): HookRemove {
    const depth = useRouterDepth()
    const hooks = useRouterHooks()
    const remove = hooks.addComponentHook({ ...registration, depth: depth - 1 })

    onUnmounted(remove)

    return remove
  }

  return {
    onBeforeRouteLeave: (hook, options) => addHook({ ...options, lifecycle: 'onBeforeRouteLeave', hook }),
    onBeforeRouteUpdate: (hook, options) => addHook({ ...options, lifecycle: 'onBeforeRouteUpdate', hook }),
    onAfterRouteLeave: (hook, options) => addHook({ ...options, lifecycle: 'onAfterRouteLeave', hook }),
    onAfterRouteUpdate: (hook, options) => addHook({ ...options, lifecycle: 'onAfterRouteUpdate', hook }),
  }
}
