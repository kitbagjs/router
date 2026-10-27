import { AnyHook } from '@/types/hook'
import { ComponentHook, HookLifecycle, HookRegistrationOptions, InternalRouteHooks } from '@/types/hooks'
import { Route } from '@/types/route'

export function withRouteHooks<TRoute extends Route>(route: TRoute): TRoute {
  const hooks = route as TRoute & InternalRouteHooks
  const result = { ...route }
  const lifecycles: HookLifecycle[] = [
    'onBeforeRouteEnter',
    'onBeforeRouteUpdate',
    'onBeforeRouteLeave',
    'onAfterRouteEnter',
    'onAfterRouteUpdate',
    'onAfterRouteLeave',
  ]

  for (const lifecycle of lifecycles) {
    const register = hooks[lifecycle] as (hook: ComponentHook | AnyHook, options?: HookRegistrationOptions) => unknown

    Object.assign(result, {
      [lifecycle]: (hook: ComponentHook | AnyHook, options?: HookRegistrationOptions) => {
        register(hook, options)

        return result
      },
    })
  }

  return result
}
