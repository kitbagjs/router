import { Component, InjectionKey } from 'vue'
import { createComponentPropsWrapper } from './component'
import { CreatedRouteOptions } from '@/types/route'
import { isWithComponent, isWithComponents } from '@/types/createRouteOptions'
import RouterView from '@/components/routerView.vue'

export type ComponentsStore = {
  getRouteComponents: (match: CreatedRouteOptions) => Record<string, Component>,
}

export const componentsStoreKey: InjectionKey<ComponentsStore> = Symbol()

export function createComponentsStore(): ComponentsStore {
  const store = new Map<string, Record<string, Component>>()

  const getRouteComponents: ComponentsStore['getRouteComponents'] = (match) => {
    const existing = store.get(match.id)

    if (existing) {
      return existing
    }

    const components = getAllComponentsForMatch(match)

    store.set(match.id, components)

    return components
  }

  return {
    getRouteComponents,
  }
}

function getAllComponentsForMatch(options: CreatedRouteOptions): Record<string, Component> {
  if (isWithComponents(options)) {
    return wrapAllComponents(options.components)
  }

  if (isWithComponent(options)) {
    return wrapAllComponents({ default: options.component })
  }

  return { default: RouterView }
}

function wrapAllComponents(components: Record<string, Component>): Record<string, Component> {
  return Object.fromEntries(
    Object.entries(components).map(([name, component]) => [name, createComponentPropsWrapper(component)]),
  )
}
