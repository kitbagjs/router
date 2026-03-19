import { Hooks } from '@/models/hooks'
import { isRouterPlugin, RouterPlugin } from '@/types/routerPlugin'

export function getGlobalHooksForRouter(plugins: RouterPlugin[] = []): Hooks {
  const hooks = new Hooks()

  plugins.forEach((plugin) => {
    if (!isRouterPlugin(plugin)) {
      return
    }

    plugin.hooks.onBeforeRouteEnter.forEach((hook) => hooks.onBeforeRouteEnter.add(hook))
    plugin.hooks.onBeforeRouteUpdate.forEach((hook) => hooks.onBeforeRouteUpdate.add(hook))
    plugin.hooks.onBeforeRouteLeave.forEach((hook) => hooks.onBeforeRouteLeave.add(hook))
    plugin.hooks.onAfterRouteEnter.forEach((hook) => hooks.onAfterRouteEnter.add(hook))
    plugin.hooks.onAfterRouteUpdate.forEach((hook) => hooks.onAfterRouteUpdate.add(hook))
    plugin.hooks.onAfterRouteLeave.forEach((hook) => hooks.onAfterRouteLeave.add(hook))
  })

  return hooks
}
