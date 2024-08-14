import { Component, defineAsyncComponent } from 'vue'

/**
 * A dummy component created to compare its name against other components to determine
 * if they were wrapped in vue's defineAsyncComponent utility
 */
const asyncComponent = defineAsyncComponent<Component>(() => {
  return new Promise(resolve => {
    resolve({ default: { template: '' } })
  })
})

export function isAsyncComponent(component: Component): boolean {
  return component.name === asyncComponent.name
}