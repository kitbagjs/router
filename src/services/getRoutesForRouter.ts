import { getRouteContext } from '@/services/getRouteContext'
import { isRoute, Route, RouteInternal, Routes } from '@/types/route'
import { RouterPlugin } from '@/types/routerPlugin'
import { DuplicateNamesError } from '@/errors/duplicateNamesError'
import { UnreachableRouteError } from '@/errors/unreachableRouteError'
import { isNamedRoute } from '@/utilities/isNamedRoute'
import { insertBaseRoute } from '@/services/insertBaseRoute'
import { BUILT_IN_REJECTIONS, BuiltInRejectionType, isRejection, Rejection, RejectionInternal } from '@/types/rejection'
import { RouterOptions } from '@/types/router'
import { createRejection } from '@/services/createRejection'
import { isUrl } from '@/types/url'
import { AnyHook, isHook } from '@/types/hook'
import { ComponentHook, getHooks } from '@/types/hooks'
import { Hooks } from '@/models/hooks'
import { RouteContext } from '@/types/routeContext'

/**
 * Takes in routes and plugins and returns a list of routes with the base route inserted if provided.
 * Also checks for duplicate names and unreachable paths in the routes.
 *
 * @throws {DuplicateNamesError} If there are duplicate names in the routes.
 * @throws {UnreachableRouteError} If a named route's path does not start with `/`.
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function getRoutesForRouter(routes: Routes | Routes[], plugins: RouterPlugin[] = [], options: RouterOptions = {}) {
  const routerRoutes = new Map<string, Route & RouteInternal>()
  const routerRejections = new Map<string, Rejection & RejectionInternal>()

  const allRoutes = [
    ...routes,
    ...plugins.map((plugin) => plugin.routes),
  ]

  const allRejections = [
    ...Object.entries(BUILT_IN_REJECTIONS).map(([type, status]) => createRejection({ type, status })),
    ...options.rejections ?? [],
    ...plugins.map((plugin) => plugin.rejections),
  ]

  const registeredRoutes: (Route & RouteInternal)[] = []
  const registeredRejections: (Rejection & RejectionInternal)[] = []
  const stores = new Set<Hooks>()
  let stopped = false

  function addHookContext(hook: ComponentHook | AnyHook): void {
    if (stopped || !isHook(hook)) {
      return
    }

    addContext(hook.context)
  }

  function addContext(context: readonly RouteContext[]): void {
    if (stopped) {
      return
    }

    const pendingRoutes = new Map<string, Route & RouteInternal>()
    const pendingRejections = new Map<string, Rejection & RejectionInternal>()

    function addRoute(route: Route): void {
      if (!isRoute(route) || !isNamedRoute(route)) {
        return
      }

      const existing = pendingRoutes.get(route.name) ?? routerRoutes.get(route.name)

      if (existing && existing.id !== route.id) {
        throw new DuplicateNamesError(route.name)
      }

      if (existing) {
        return
      }

      const routerRoute = insertBaseRoute(route, options.base)

      if (isUnreachable(routerRoute)) {
        throw new UnreachableRouteError(route.name, getPath(routerRoute))
      }

      pendingRoutes.set(route.name, routerRoute)
      addTargets(getRouteContext(route))
    }

    function addTargets(targets: readonly RouteContext[]): void {
      for (const target of targets) {
        if (isRoute(target)) {
          addRoute(target)
        }

        if (isRejection(target)) {
          pendingRejections.set(target.type, target)
        }
      }
    }

    addTargets(context)

    for (const [name, route] of pendingRoutes) {
      routerRoutes.set(name, route)
      registeredRoutes.push(route)

      for (const store of getHooks(route)) {
        if (stores.has(store)) {
          continue
        }

        stores.add(store)
        store.onHookAdded.add(addHookContext)
      }
    }

    for (const [type, rejection] of pendingRejections) {
      routerRejections.set(type, rejection)
    }

    registeredRoutes.sort(sortByDepthDescending)
    registeredRejections.splice(0, registeredRejections.length, ...routerRejections.values())
  }

  addContext([...allRoutes.flat(), ...allRejections.flat()])

  function getRouteByName(type: string): Route | undefined {
    return routerRoutes.get(type)
  }

  function getRejectionByType(type: BuiltInRejectionType): (Rejection & RejectionInternal)
  function getRejectionByType(type: string): (Rejection & RejectionInternal) | undefined
  function getRejectionByType(type: string): (Rejection & RejectionInternal) | undefined {
    return routerRejections.get(type)
  }

  function stop(): void {
    stopped = true

    for (const store of stores) {
      store.onHookAdded.delete(addHookContext)
    }

    stores.clear()
  }

  return {
    routes: registeredRoutes,
    rejections: registeredRejections,
    addHookContext,
    addContext,
    stop,
    getRouteByName,
    getRejectionByType,
  }
}

function sortByDepthDescending(aRoute: Route & RouteInternal, bRoute: Route & RouteInternal): number {
  return bRoute.depth - aRoute.depth
}

function getPath(route: Route): string {
  return isUrl(route) ? route.schema.path.value : ''
}

function isUnreachable(route: Route): boolean {
  return route.isRelative && !getPath(route).startsWith('/')
}
