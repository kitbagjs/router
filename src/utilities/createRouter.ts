import { readonly } from 'vue'
import { Resolved, Route, RouteMethods, Routes } from '@/types'
import { createRouteMethods, createRouterNavigation, resolveRoutes, routeMatch } from '@/utilities'
import { resolveRoutesRegex } from '@/utilities/resolveRoutesRegex'

type RouterPush = (url: string, options?: { replace: boolean }) => Promise<void>
type RouterReplace = (url: string) => Promise<void>

export type Router<
  TRoutes extends Routes
> = {
  routes: RouteMethods<TRoutes>,
  route: Readonly<Resolved<Route>>,
  push: RouterPush,
  replace: RouterReplace,
  back: () => void,
  forward: () => void,
  go: (delta: number) => void,
}

export function createRouter<T extends Routes>(routes: T): Router<T> {
  const resolved = resolveRoutes(routes)
  const resolvedWithRegex = resolveRoutesRegex(resolved)
  const navigation = createRouterNavigation({
    onLocationUpdate,
  })

  // todo: implement this
  const route: Router<T>['route'] = readonly({} as any)

  async function onLocationUpdate(url: string): Promise<void> {
    const match = routeMatch(resolvedWithRegex, url)

    if (!match) {
      throw 'not implemented'
    }

    throw 'not implemented'
  }

  const push: RouterPush = async (url, options) => {
    await navigation.update(url, options)
  }

  const replace: RouterReplace = async (url) => {
    await navigation.update(url, { replace: true })
  }

  const router = {
    routes: createRouteMethods<T>(resolved),
    route,
    push,
    replace,
    forward: navigation.forward,
    back: navigation.back,
    go: navigation.go,
  }

  return router
}