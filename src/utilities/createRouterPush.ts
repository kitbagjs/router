import { Resolved, Route, RouterPush, RouterPushOptions, Routes } from '@/types'
import { flattenParentMatches } from '@/utilities/flattenParentMatches'
import { RouterNavigation } from '@/utilities/routerNavigation'
import { component } from '@/utilities/testHelpers'
import { assembleUrl } from '@/utilities/urlAssembly'

type DummyRoutes = [{ name: string, path: '/', component: typeof component }]

type RouterPushContext = {
  navigation: RouterNavigation,
  resolved: Resolved<Route>[],
}

export function createRouterPush<const TRoutes extends Routes>({ navigation, resolved }: RouterPushContext): RouterPush<TRoutes> {

  const push: RouterPush<DummyRoutes> = (urlOrRouteConfig, options?: RouterPushOptions) => {
    if (typeof urlOrRouteConfig === 'object') {
      const { route, params, ...options } = urlOrRouteConfig
      const match = resolved.find((resolvedRoute) => flattenParentMatches(resolvedRoute) === route)

      if (!match) {
        throw `No route found: "${String(route)}"`
      }

      const url = assembleUrl(match, params)

      return push(url, options)
    }

    if (typeof urlOrRouteConfig === 'string') {
      return navigation.update(urlOrRouteConfig, options)
    }

    const exhaustive: never = urlOrRouteConfig
    throw new Error(`Unhandled router push overload: ${JSON.stringify(exhaustive)}`)
  }

  return push as any
}