import { isRoute, Route, RouteInternal, Routes } from '@/types/route'
import { RouterPlugin } from '@/types/routerPlugin'
import { DuplicateNamesError } from '@/errors/duplicateNamesError'
import { UnreachableRouteError } from '@/errors/unreachableRouteError'
import { isNamedRoute } from '@/utilities/isNamedRoute'
import { insertBaseRoute } from '@/services/insertBaseRoute'
import { BUILT_IN_REJECTIONS, BuiltInRejectionType, isRejection, Rejection } from '@/types/rejection'
import { RouterOptions } from '@/types/router'
import { createRejection } from '@/services/createRejection'
import { isUrl } from '@/types/url'

/** Registers all destinations by name, keeping URL matching limited to addressable routes. */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function getRoutesForRouter(routes: Routes | Routes[], plugins: RouterPlugin[] = [], options: RouterOptions = {}) {
  const definitions = new Map<string, Route & RouteInternal>()

  function addRoute(route: Route): void {
    if (!isRoute(route) || !isNamedRoute(route)) {
      return
    }

    const existing = definitions.get(route.name)

    if (existing) {
      if (existing.id !== route.id) {
        throw new DuplicateNamesError(route.name)
      }

      return
    }

    const definition = insertBaseRoute(route, options.base)

    if (!isRejection(route) && isUnreachable(definition)) {
      throw new UnreachableRouteError(route.name, getPath(definition))
    }

    definitions.set(route.name, definition)

    for (const context of route.context) {
      if (isRoute(context)) {
        addRoute(context)
      }
    }
  }

  const allRoutes = [
    ...routes.flat(),
    ...options.rejections ?? [],
    ...plugins.flatMap((plugin) => [...plugin.routes, ...plugin.rejections]),
  ]

  allRoutes.forEach(addRoute)

  for (const [type, status] of Object.entries(BUILT_IN_REJECTIONS)) {
    const existing = definitions.get(type)

    if (!existing) {
      addRoute(createRejection({ type, status }))
    } else if (!isRejection(existing)) {
      throw new DuplicateNamesError(type)
    }
  }

  function getRouteByName(name: string): Route | undefined {
    return definitions.get(name)
  }

  function getRejectionByType(type: BuiltInRejectionType): Rejection & RouteInternal
  function getRejectionByType(type: string): (Rejection & RouteInternal) | undefined
  function getRejectionByType(type: string): (Rejection & RouteInternal) | undefined {
    const route = definitions.get(type)

    return isRejection(route) ? route : undefined
  }

  const registered = Array.from(definitions.values())

  return {
    routes: registered.filter((route) => !isRejection(route) || route.aliases.length > 0).sort(sortByDepthDescending),
    rejections: registered.filter(isRejection),
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
