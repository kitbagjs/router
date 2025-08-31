import { Component, InjectionKey } from 'vue'
import { createComponentPropsWrapper } from './component'
import { CreatedRouteOptions } from '@/types/route'
import { isWithComponent, isWithComponents } from '@/types/createRouteOptions'
import { RouterView } from '@/components/routerView'
import { Router } from '@/types/router'

export type ComponentsStore = {
  getRouteComponents: (match: CreatedRouteOptions) => Record<string, Component>,
}

export function createComponentsStore<TRouter extends Router>(routerKey: InjectionKey<TRouter>): ComponentsStore {
  const store = new Map<string, Record<string, Component>>()

  const getRouteComponents: ComponentsStore['getRouteComponents'] = (match) => {
    const existing = store.get(match.id)

    if (existing) {
      return existing
    }

    const components = getAllComponentsForMatch(routerKey, match)

    store.set(match.id, components)

    return components
  }

  return {
    getRouteComponents,
  }
}

function getAllComponentsForMatch(routerKey: InjectionKey<Router>, options: CreatedRouteOptions): Record<string, Component> {
  if (isWithComponents(options)) {
    return wrapAllComponents(routerKey, options, options.components)
  }

  if (isWithComponent(options)) {
    return wrapAllComponents(routerKey, options, { default: options.component })
  }

  return { default: RouterView }
}

function wrapAllComponents(routerKey: InjectionKey<Router>, match: CreatedRouteOptions, components: Record<string, Component>): Record<string, Component> {
  return Object.fromEntries(
    Object.entries(components).map(([name, component]) => [name, createComponentPropsWrapper(routerKey, { match, name, component })]),
  )
}
