<template>
  <template v-if="component">
    <slot name="default" v-bind="{ route, component, props, rejection }">
      <template v-if="rejection">
        <component :is="rejection.component" />
      </template>
      <template v-else>
        <component :is="component" :props="props" />
      </template>
    </slot>
  </template>
</template>

<script lang="ts" setup>
  import { Component, UnwrapRef, VNode, computed, provide } from 'vue'
  import { usePropStore } from '@/compositions/usePropStore'
  import { useRejection } from '@/compositions/useRejection'
  import { useRoute } from '@/compositions/useRoute'
  import { useRouterDepth } from '@/compositions/useRouterDepth'
  import { RouterRejection } from '@/services/createRouterReject'
  import { RouterRoute } from '@/services/createRouterRoute'
  import { depthInjectionKey } from '@/types/injectionDepth'
  import { useComponentsStore } from '@/compositions/useComponentsStore'

  const { name = 'default' } = defineProps<{
    name?: string,
    props?: unknown,
  }>()

  const route = useRoute()
  const rejection = useRejection()
  const depth = useRouterDepth()

  const { getProps } = usePropStore()
  const { getRouteComponents } = useComponentsStore()

  defineSlots<{
    default?: (props: {
      route: RouterRoute,
      component: Component,
      props: unknown,
      rejection: UnwrapRef<RouterRejection>,
    }) => VNode,
  }>()

  provide(depthInjectionKey, depth + 1)

  const props = computed(() => {
    const match = route.matches.at(depth)

    if (!match) {
      return null
    }

    return getProps(match.id, name, route)
  })

  const component = computed(() => {
    const match = route.matches.at(depth)

    if (!match) {
      return null
    }

    const components = getRouteComponents(match)

    return components[name]
  })
</script>
