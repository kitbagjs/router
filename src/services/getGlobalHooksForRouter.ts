import { Hooks } from '@/models/hooks'
import { isRouterPlugin, RouterPlugin } from '@/types/routerPlugin'

export function getGlobalHooksForRouter(plugins: RouterPlugin[] = []): Hooks[] {
  return plugins.filter(isRouterPlugin).map((plugin) => plugin.hooks)
}
