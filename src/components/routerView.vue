<template>
  <template v-if="rejection">
    <component :is="rejection.component" />
  </template>
  <template v-else>
    <slot name="default" :route="router.route" :component="component">
      <component :is="component" />
    </slot>
  </template>
</template>

<script lang="ts" setup>
  import { AsyncComponentLoader, DeepReadonly, computed, defineAsyncComponent, provide, resolveComponent } from 'vue'
  import { useRejection } from '@/compositions/useRejection'
  import { useRouter } from '@/compositions/useRouter'
  import { useRouterDepth } from '@/compositions/useRouterDepth'
  import { ResolvedRoute, RouteComponent, depthInjectionKey } from '@/types'

  const router = useRouter()
  const rejection = useRejection()
  const depth = useRouterDepth()
  const routerView = resolveComponent('RouterView', true)

  defineSlots<{
    default?: (props: {
      route: DeepReadonly<ResolvedRoute>,
      component: RouteComponent,
    }) => unknown,
  }>()

  provide(depthInjectionKey, depth + 1)

  const component = computed(() => {
    const routeComponent = router.route.matches[depth].component

    if (routeComponent) {
      if (typeof routeComponent === 'function') {
        return defineAsyncComponent(routeComponent as AsyncComponentLoader)
      }

      return routeComponent
    }

    return routerView
  })
</script>