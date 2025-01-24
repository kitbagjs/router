<template>
  <template v-if="component">
    <slot name="default" v-bind="{ route, component, rejection }">
      <template v-if="rejection">
        <component :is="rejection.component" />
      </template>
      <template v-else>
        <ComponentPropsWrapper :component="component" :props="props" />
      </template>
    </slot>
  </template>
</template>

<script lang="ts" setup>
  import { Component, UnwrapRef, VNode, computed, provide, resolveComponent } from 'vue'
  import { usePropStore } from '@/compositions/usePropStore'
  import { useRejection } from '@/compositions/useRejection'
  import { useRoute } from '@/compositions/useRoute'
  import { useRouterDepth } from '@/compositions/useRouterDepth'
  import { RouterRejection } from '@/services/createRouterReject'
  import { RouterRoute } from '@/services/createRouterRoute'
  import { CreateRouteOptions, isWithComponent, isWithComponents } from '@/types/createRouteOptions'
  import { depthInjectionKey } from '@/types/injectionDepth'
  import { ComponentPropsWrapper } from '@/services/component'

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

    return getComponent(match)
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
