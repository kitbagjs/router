<template>
  <template v-if="component">
    <slot name="default" v-bind="{ route, component, rejection }">
      <component :is="component" />
    </slot>
  </template>
</template>

<script lang="ts" setup>
  import { Component, UnwrapRef, VNode, computed, provide, resolveComponent } from 'vue'
  import { usePropStore } from '@/compositions/usePropStore'
  import { useRejection } from '@/compositions/useRejection'
  import { useRoute } from '@/compositions/useRoute'
  import { useRouterDepth } from '@/compositions/useRouterDepth'
  import { component as componentUtil } from '@/services/component'
  import { RouterRejection } from '@/services/createRouterReject'
  import { RouterRoute } from '@/services/createRouterRoute'
  import { CreateRouteOptions, isWithComponent, isWithComponents } from '@/types/createRouteOptions'
  import { depthInjectionKey } from '@/types/injectionDepth'

  const { name = 'default' } = defineProps<{
    name?: string,
  }>()

  const route = useRoute()
  const rejection = useRejection()
  const depth = useRouterDepth()

  const { getProps } = usePropStore()
  const routerView = resolveComponent('RouterView', true)

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

    const component = getComponent(match)
    const props = getProps(match.id, name, route.params)

    if (!component) {
      return null
    }

    if (props) {
      return componentUtil(component, () => props)
    }

    return component
  })

  function getComponent(match: CreateRouteOptions): Component | undefined {
    const allComponents = getAllComponents(match)

    return allComponents[name]
  }

  function getAllComponents(options: CreateRouteOptions): Record<string, Component | undefined> {
    if (isWithComponents(options)) {
      return options.components
    }

    if (isWithComponent(options)) {
      return { default: options.component }
    }

    if (typeof routerView === 'string') {
      return {}
    }

    return { default: routerView }
  }
</script>