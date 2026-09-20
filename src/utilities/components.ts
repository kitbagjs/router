import { Component, defineAsyncComponent } from 'vue'
import { ResolvedRoute } from '@/types/resolved'
import { CreatedRouteOptions } from '@/types/route'
import { RouteView } from '@/types/routeViews'

/**
 * A dummy component created to compare its name against other components to determine
 * if they were wrapped in vue's defineAsyncComponent utility
 */
const asyncComponent = defineAsyncComponent<Component>(() => {
  return new Promise((resolve) => {
    resolve({ default: { template: 'foo' } })
  })
})

type ComponentWithAsyncLoader = Component & { __asyncLoader: () => Promise<unknown> }

export function isAsyncComponent(component: Component): component is ComponentWithAsyncLoader {
  return component.name === asyncComponent.name && '__asyncLoader' in component
}

/**
 * Decides which of a route's views to load.
 */
export type AsyncComponentFilter = (match: CreatedRouteOptions, view: RouteView<unknown>) => boolean

/**
 * Loads the async components a route renders, or only those the filter keeps, so they are ready to render
 * synchronously.
 */
export function loadAsyncComponents(route: ResolvedRoute, filter: AsyncComponentFilter = () => true): Promise<unknown> {
  const loading = route.matches.flatMap((match) => Object.values(match.views).flatMap((view) => {
    if (view.component && isAsyncComponent(view.component) && filter(match, view)) {
      return [view.component.__asyncLoader()]
    }

    return []
  }))

  return Promise.all(loading)
}
