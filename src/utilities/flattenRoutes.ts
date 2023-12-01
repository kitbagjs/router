import { RouteFlat, Routes } from '@/types'

export function flattenRoutes<T extends Routes>(routes: T, path = ''): RouteFlat[] {
  return routes.reduce<RouteFlat[]>((value, route) => {
    const fullPath = path + route.path

    if (route.children) {
      const flattened = flattenRoutes(route.children, fullPath)

      value = value.concat(flattened)
    } else {
      value.push({
        name: route.name,
        regex: generateRouteRegexPattern(fullPath),
        path: fullPath,
      })
    }

    return value
  }, [])
}

export function generateRouteRegexPattern(path: string): RegExp {
  const paramRegex = /(:[\w-]+)(?:\W|$)/g

  return new RegExp(path.replace(paramRegex, '(.*?)'))
}