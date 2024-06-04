<template>
  <slot name="default" v-bind="{ route, component, rejection }">
    <component :is="component" />
  </slot>
</template>

<script lang="ts" setup>
  import { AsyncComponentLoader, Component, UnwrapRef, VNode, computed, defineAsyncComponent, provide } from 'vue'
  import { useRejection } from '@/compositions/useRejection'
  import { useRoute } from '@/compositions/useRoute'
  import { useRouterDepth } from '@/compositions/useRouterDepth'
  import { RouterRejection } from '@/services/createRouterReject'
  import { RouterRoute } from '@/services/createRouterRoute'
  import { depthInjectionKey } from '@/types/injectionDepth'
  import { RouteProps, isRouteWithComponent, isRouteWithComponents } from '@/types/routeProps'

  const { name = 'default' } = defineProps<{
    name?: string,
  }>()

  const route = useRoute()
  const rejection = useRejection()
  const depth = useRouterDepth()

  defineSlots<{
    default?: (props: {
      route: RouterRoute,
      component: Component,
      rejection: UnwrapRef<RouterRejection>,
    }) => VNode,
  }>()

  provide(depthInjectionKey, depth + 1)

  const component = computed(() => {
    if (rejection.value) {
      return rejection.value.component
    }

    const match = route.matches.at(depth)

    if (!match) {
      return null
    }

    const components = getComponents(match)
    const component = components[name]

    if (component) {
      if (typeof component === 'function') {
        return defineAsyncComponent(component as AsyncComponentLoader)
      }

      return component
    }

    return null
  })

  function getComponents(route: RouteProps): Record<string, Component | undefined> {
    if (isRouteWithComponents(route)) {
      return route.components
    }

    if (isRouteWithComponent(route)) {
      return { default: route.component }
    }

    return {}
  }
</script>