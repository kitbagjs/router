import { RouterRouteHooks } from '@/models/RouterRouteHooks'
import { RouterOptions } from '@/types/router'
import { RouterPlugin } from '@/types/routerPlugin'
import { asArray } from '@/utilities'

export function getGlobalHooksForRouter(options: RouterOptions = {}, plugins: RouterPlugin[] = []): RouterRouteHooks {
  const hooks = new RouterRouteHooks()

  asArray(options.onBeforeRouteEnter ?? []).forEach((hook) => hooks.onBeforeRouteEnter.add(hook))
  asArray(options.onBeforeRouteUpdate ?? []).forEach((hook) => hooks.onBeforeRouteUpdate.add(hook))
  asArray(options.onBeforeRouteLeave ?? []).forEach((hook) => hooks.onBeforeRouteLeave.add(hook))
  asArray(options.onAfterRouteEnter ?? []).forEach((hook) => hooks.onAfterRouteEnter.add(hook))
  asArray(options.onAfterRouteUpdate ?? []).forEach((hook) => hooks.onAfterRouteUpdate.add(hook))
  asArray(options.onAfterRouteLeave ?? []).forEach((hook) => hooks.onAfterRouteLeave.add(hook))

  plugins.forEach((plugin) => {
    plugin.hooks.onBeforeRouteEnter.forEach((hook) => hooks.onBeforeRouteEnter.add(hook))
    plugin.hooks.onBeforeRouteUpdate.forEach((hook) => hooks.onBeforeRouteUpdate.add(hook))
    plugin.hooks.onBeforeRouteLeave.forEach((hook) => hooks.onBeforeRouteLeave.add(hook))
    plugin.hooks.onAfterRouteEnter.forEach((hook) => hooks.onAfterRouteEnter.add(hook))
    plugin.hooks.onAfterRouteUpdate.forEach((hook) => hooks.onAfterRouteUpdate.add(hook))
    plugin.hooks.onAfterRouteLeave.forEach((hook) => hooks.onAfterRouteLeave.add(hook))
  })

  return hooks
}
