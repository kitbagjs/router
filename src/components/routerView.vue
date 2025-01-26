<template>
  <template v-if="component">
    <slot name="default" v-bind="{ route, component, rejection }">
      <component :is="component" />
    </slot>
  </template>
</template>

<script lang="ts" setup>
  import { Component, UnwrapRef, VNode, computed, provide } from 'vue'
  import { useRejection } from '@/compositions/useRejection'
  import { useRoute } from '@/compositions/useRoute'
  import { useRouterDepth } from '@/compositions/useRouterDepth'
  import { RouterRejection } from '@/services/createRouterReject'
  import { RouterRoute } from '@/services/createRouterRoute'
  import { depthInjectionKey } from '@/types/injectionDepth'
  import { useComponentsStore } from '@/compositions/useComponentsStore'

  const { name = 'default' } = defineProps<{
    name?: string,
  }>()

  const route = useRoute()
  const rejection = useRejection()
  const depth = useRouterDepth()

  const { getRouteComponents } = useComponentsStore()

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

    const components = getRouteComponents(match)

    return components[name]
  })
</script>
