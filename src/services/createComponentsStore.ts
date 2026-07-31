import { Component, InjectionKey } from 'vue'
import { createComponentPropsWrapper } from './component'
import { RouteViews } from '@/types/routeViews'
import { Router } from '@/types/router'
import { createRouterView } from '@/components/routerView'

export type ComponentsStore = {
  getRouteComponents: (id: string, views: RouteViews) => Record<string, Component>,
}

export function createComponentsStore<TRouter extends Router>(routerKey: InjectionKey<TRouter>): ComponentsStore {
  const store = new Map<string, Record<string, Component>>()

  const getRouteComponents: ComponentsStore['getRouteComponents'] = (id, views) => {
    const existing = store.get(id)

    if (existing) {
      return existing
    }

    const components = getComponentsForViews(routerKey, id, views)

    store.set(id, components)

    return components
  }

  return {
    getRouteComponents,
  }
}

function getComponentsForViews(routerKey: InjectionKey<Router>, id: string, views: RouteViews): Record<string, Component> {
  const RouterView = createRouterView(routerKey)

  const components = Object.entries(views).reduce<[string, Component][]>((entries, [name, view]) => {
    if (view.component) {
      entries.push([name, view.component])
    }

    return entries
  }, [])

  if (components.length === 0) {
    return { default: RouterView }
  }

  return Object.fromEntries(
    components.map(([name, component]) => [name, createComponentPropsWrapper(routerKey, { id, name, component })]),
  )
}
