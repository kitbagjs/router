import { Component, defineAsyncComponent } from 'vue'

/**
 * A dummy component created to compare its name against other components to determine
 * if they were wrapped in vue's defineAsyncComponent utility
 */
const asyncComponent = defineAsyncComponent<Component>(() => {
  return new Promise((resolve) => {
    resolve({ default: { template: 'foo' } })
  })
})

type ComponentWithSetup = Component & { setup: () => void }

export function isAsyncComponent(component: Component): component is ComponentWithSetup {
  return component.name === asyncComponent.name && 'setup' in component
}
