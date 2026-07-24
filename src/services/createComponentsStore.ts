import { Component, InjectionKey } from 'vue'
import { createComponentPropsWrapper } from './component'
import { RouteViews } from '@/types/routeViews'
import { Router } from '@/types/router'
import { createRouterView } from '@/components/routerView'

export type ComponentsStore = {
  getRouteComponents: (views: RouteViews) => Record<string, Component>,
}

export function createComponentsStore<TRouter extends Router>(routerKey: InjectionKey<TRouter>): ComponentsStore {
  const store = new Map<string, Record<string, Component>>()

  const getRouteComponents: ComponentsStore['getRouteComponents'] = (views) => {
    const existing = store.get(views.id)

    if (existing) {
      return existing
    }

    const components = getComponentsForViews(routerKey, views)

    store.set(views.id, components)

    return components
  }

  return {
    getRouteComponents,
  }
}

function getComponentsForViews(routerKey: InjectionKey<Router>, views: RouteViews): Record<string, Component> {
  const RouterView = createRouterView(routerKey)

  if (Object.keys(views.components).length === 0) {
    return { default: RouterView }
  }

  return Object.fromEntries(
    Object.entries(views.components).map(([name, component]) => [name, createComponentPropsWrapper(routerKey, { id: views.id, name, component })]),
  )
}
