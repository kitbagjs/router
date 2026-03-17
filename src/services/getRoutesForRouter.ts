import { isRoute, Route, Routes } from '@/types/route'
import { RouterPlugin } from '@/types/routerPlugin'
import { DuplicateNamesError } from '@/errors/duplicateNamesError'
import { isNamedRoute } from '@/utilities/isNamedRoute'
import { insertBaseRoute } from '@/services/insertBaseRoute'
import { BUILT_IN_REJECTION_TYPES, BuiltInRejectionType, isRejection, Rejection, RejectionInternal, Rejections } from '@/types/rejection'
import { RouterOptions } from '@/types/router'
import { createRejection } from '@/services/createRejection'

/**
 * Takes in routes and plugins and returns a list of routes with the base route inserted if provided.
 * Also checks for duplicate names in the routes.
 *
 * @throws {DuplicateNamesError} If there are duplicate names in the routes.
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function getRoutesForRouter(routes: Routes | Routes[], plugins: RouterPlugin[] = [], options: RouterOptions = {}) {
  const routerRoutes = new Map<string, Route>()
  const routerRejections = new Map<string, (Rejection & RejectionInternal)>()

  const allRoutes = [
    ...routes,
    ...plugins.map((plugin) => plugin.routes),
  ]

  const allRejections = [
    ...BUILT_IN_REJECTION_TYPES.map((type) => createRejection({ type })),
    ...options.rejections ?? [],
    ...plugins.map((plugin) => plugin.rejections),
  ]

  function addRoute(route: Route): void {
    if (!isNamedRoute(route)) {
      return
    }

    const existingRouteByName = routerRoutes.get(route.name)

    if (existingRouteByName && existingRouteByName.id !== route.id) {
      throw new DuplicateNamesError(route.name)
    }

    if (existingRouteByName && existingRouteByName.id === route.id) {
      return
    }

    routerRoutes.set(route.name, insertBaseRoute(route, options.base))

    for (const context of route.context) {
      if (isRoute(context)) {
        addRoute(context)
      }

      if (isRejection(context)) {
        addRejection(context)
      }
    }
  }

  function addRejection(rejection: Rejection): void {
    if (!isRejection(rejection)) {
      return
    }

    routerRejections.set(rejection.type, rejection)
  }

  function addRoutes(routes: Routes): void {
    for (const route of routes) {
      addRoute(route)
    }
  }

  function addRejections(rejections: Rejections): void {
    for (const rejection of rejections) {
      addRejection(rejection)
    }
  }

  for (const route of allRoutes) {
    if (isRoutes(route)) {
      addRoutes(route)
      continue
    }

    addRoute(route)
  }

  for (const rejection of allRejections) {
    if (isRejections(rejection)) {
      addRejections(rejection)
      continue
    }

    addRejection(rejection)
  }

  function getRouteByName(type: string): Route | undefined {
    return routerRoutes.get(type)
  }

  function getRejectionByType(type: BuiltInRejectionType): (Rejection & RejectionInternal)
  function getRejectionByType(type: string): (Rejection & RejectionInternal) | undefined
  function getRejectionByType(type: string): (Rejection & RejectionInternal) | undefined {
    return routerRejections.get(type)
  }

  return {
    routes: Array.from(routerRoutes.values()).sort(sortByDepthDescending),
    rejections: Array.from(routerRejections.values()),
    getRouteByName,
    getRejectionByType,
  }
}

function isRoutes(routes: Routes | Route): routes is Routes {
  return Array.isArray(routes)
}

function isRejections(rejections: Rejections | Rejection): rejections is Rejections {
  return Array.isArray(rejections)
}

function sortByDepthDescending(aRoute: Route, bRoute: Route): number {
  return bRoute.depth - aRoute.depth
}
