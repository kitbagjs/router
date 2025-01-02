import { RouteHooks } from '@/models/RouteHooks'
import { AfterRouteHookLifecycle, BeforeRouteHookLifecycle } from '@/types/hooks'
import { RouterOptions } from '@/types/router'
import { RouterPlugin } from '@/types/routerPlugin'

export function getGlobalHooksForRouter(options: RouterOptions = {}, plugins: RouterPlugin[] = []): RouteHooks {
  const hooks = new RouteHooks()

  getHooksForLifecycle('onBeforeRouteEnter', options, plugins).forEach((hook) => hooks.onBeforeRouteEnter.add(hook))
  getHooksForLifecycle('onBeforeRouteUpdate', options, plugins).forEach((hook) => hooks.onBeforeRouteUpdate.add(hook))
  getHooksForLifecycle('onBeforeRouteLeave', options, plugins).forEach((hook) => hooks.onBeforeRouteLeave.add(hook))
  getHooksForLifecycle('onAfterRouteEnter', options, plugins).forEach((hook) => hooks.onAfterRouteEnter.add(hook))
  getHooksForLifecycle('onAfterRouteUpdate', options, plugins).forEach((hook) => hooks.onAfterRouteUpdate.add(hook))
  getHooksForLifecycle('onAfterRouteLeave', options, plugins).forEach((hook) => hooks.onAfterRouteLeave.add(hook))

  return hooks
}

// This is more accurate to just let typescript infer the type
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function getHooksForLifecycle<T extends BeforeRouteHookLifecycle | AfterRouteHookLifecycle>(lifecycle: T, options: RouterOptions, plugins: RouterPlugin[]) {
  return [options[lifecycle], ...plugins.map((plugin) => plugin[lifecycle])].flat().filter((hook) => hook !== undefined)
}
