import { readonly } from 'vue'
import { Resolved, Route, RouteMethods, Routes } from '@/types'
import { createRouteMethods, createRouterNavigation, resolveRoutes } from '@/utilities'
import { resolveRoutesRegex } from '@/utilities/resolveRoutesRegex'
import { routeMatch } from '@/utilities/routeMatch'
import { updateBrowserUrl } from '@/utilities/updateBrowserUrl'

type RouterPush = (url: string, options?: { replace: boolean }) => Promise<void>
type RouterReplace = (url: string) => Promise<void>
type RouterBackForward = () => Promise<void>
type RouterGo = (delta: number) => Promise<void>

export type Router<
  TRoutes extends Routes
> = {
  routes: RouteMethods<TRoutes>,
  route: Readonly<Resolved<Route>>,
  push: RouterPush,
  replace: RouterReplace,
  back: RouterBackForward,
  forward: RouterBackForward,
  go: RouterGo,
}

export function createRouter<T extends Routes>(routes: T): Router<T> {
  const resolved = resolveRoutes(routes)
  const resolvedWithRegex = resolveRoutesRegex(resolved)
  const routerNavigation = createRouterNavigation()

  // todo: implement this
  const route: Router<T>['route'] = readonly({} as any)

  const push: RouterPush = async (url, options) => {
    const match = routeMatch(resolvedWithRegex, url)

    if (!match) {
      return updateBrowserUrl(url, options)
    }

    await routerNavigation.update(url, options)
  }

  const replace: RouterReplace = (url) => {
    return push(url, { replace: true })
  }

  const forward: RouterBackForward = async () => {
    await routerNavigation.forward()
  }

  const back: RouterBackForward = async () => {
    await routerNavigation.back()
  }

  const go: RouterGo = async (delta) => {
    await routerNavigation.go(delta)
  }

  const router = {
    routes: createRouteMethods<T>(resolved),
    route,
    push,
    replace,
    forward,
    back,
    go,
  }

  return router
}