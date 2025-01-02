import { AfterRouteHookLifecycle, BeforeRouteHookLifecycle, Hooks } from '@/types/hooks'
import { RouterOptions } from '@/types/router'
import { RouterPlugin } from '@/types/routerPlugin'
import { AsArray } from '@/types/utilities'

export function getGlobalHooksForRouter(options: RouterOptions = {}, plugins: RouterPlugin[] = []): Hooks {
  return {
    onBeforeRouteEnter: getHooksForLifecycle('onBeforeRouteEnter', options, plugins),
    onBeforeRouteUpdate: getHooksForLifecycle('onBeforeRouteUpdate', options, plugins),
    onBeforeRouteLeave: getHooksForLifecycle('onBeforeRouteLeave', options, plugins),
    onAfterRouteEnter: getHooksForLifecycle('onAfterRouteEnter', options, plugins),
    onAfterRouteUpdate: getHooksForLifecycle('onAfterRouteUpdate', options, plugins),
    onAfterRouteLeave: getHooksForLifecycle('onAfterRouteLeave', options, plugins),
  }
}

function getHooksForLifecycle<T extends BeforeRouteHookLifecycle | AfterRouteHookLifecycle>(lifecycle: T, options: RouterOptions, plugins: RouterPlugin[]): AsArray<Hooks[T]> {
  const hooks = [
    options[lifecycle],
    ...plugins.map((plugin) => plugin[lifecycle]),
  ].flat().filter((hook) => hook !== undefined)

  return hooks as AsArray<Hooks[T]>
}
