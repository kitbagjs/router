import { MaybeLazy, Resolved, Route, RouteComponent } from '@/types'

type LoadedRoute = Route & { component: RouteComponent | undefined }
type Loaded<T extends Resolved<Route>> = T & {
  matches: LoadedRoute[],
}

export async function loadRoute<T extends Resolved<Route>>(route: T): Promise<Loaded<T>> {
  const loaded = await Promise.all(route.matches.map(loadMatch))

  return {
    ...route,
    matches: loaded,
  }
}

function loadMatch(match: Route): Promise<LoadedRoute> {
  const component = match.component && isLazyComponent(match.component) ? match.component() : Promise.resolve(match.component)

  return component.then(resolved => {
    if (!resolved) {
      return Promise.reject(
        new Error(
          `Couldn't resolve component "${match.name}" at "${match.path}". Ensure you passed a function that returns a promise.`,
        ),
      )
    }

    const resolvedComponent = isESModule(resolved)
      ? resolved.default as RouteComponent
      : resolved

    return {
      ...match,
      component: resolvedComponent,
    }
  })
}

function isLazyComponent(component: MaybeLazy<RouteComponent>): component is (() => Promise<RouteComponent>) {
  return typeof component === 'function'
}

function isESModule(value: any): value is { default: unknown } {
  return value.__esModule || value[Symbol.toStringTag] === 'Module'
}