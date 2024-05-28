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

    const routeComponent = route.matches[depth]?.component

    if (routeComponent) {
      if (typeof routeComponent === 'function') {
        return defineAsyncComponent(routeComponent as AsyncComponentLoader)
      }
      return routeComponent
    }

    return null
  })
</script>