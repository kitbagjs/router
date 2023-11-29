import { Route, Routes } from "./routes";

export type RouteFlat = { name: string, regex: RegExp }

export function flattenRoutes<T extends Routes>(routes: T, path = ''): RouteFlat[] {
  return routes.reduce<RouteFlat[]>((value, route) => {
    const routeRegex = generateRouteRegexPattern(path, route)

    value.push({
      name: route.name,
      regex: new RegExp(routeRegex)
    })

    if(route.children) {
      const flattened = flattenRoutes(route.children, routeRegex)
      value = value.concat()
    }

    return value
  },[])
}

export function generateRouteRegexPattern(path: string, route: Route): string {
  const paramRegex = /(:[\w-]+)\W/g

  throw 'not implemented'
}

export function combineRoute(...parts:string[]): string {
  return parts.map(removeLeadingAndTrailingSlashes).join('/')
}

export function removeLeadingAndTrailingSlashes(value: string): string {
  const regex = /^\/*(.*?)\/*$/g

  const [, inside] = regex.exec(value) ?? []
  return inside
}

export function routeMatch<T extends Routes>(routes: T): void {
  throw 'not implemented'
}

// export function match<T extends Routes>(routes: T): T[number] {
//   routes
// }