import { createUseComponentsStore } from '@/compositions/useComponentsStore'
import { createUseRejection } from '@/compositions/useRejection'
import { createUseRoute } from '@/compositions/useRoute'
import { createUseRouter } from '@/compositions/useRouter'
import { createUseRouterDepth } from '@/compositions/useRouterDepth'
import { RouterRejection } from '@/services/createRouterReject'
import { RouterRoute } from '@/types/routerRoute'
import { Router } from '@/types/router'
import { Component, computed, defineComponent, EmitsOptions, h, InjectionKey, onServerPrefetch, SetupContext, SlotsType, UnwrapRef, VNode } from 'vue'

export type RouterViewProps = {
  name?: string,
}

type RouterViewSlots = {
  default?: (props: {
    route: RouterRoute,
    component: Component,
    rejection: UnwrapRef<RouterRejection>,
  }) => VNode,
}

// Infering the return type of the component is more accurate than defining it manually
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function createRouterView<TRouter extends Router>(routerKey: InjectionKey<TRouter>) {
  const useRoute = createUseRoute(routerKey)
  const useRouter = createUseRouter(routerKey)
  const useRejection = createUseRejection(routerKey)
  const useRouterDepth = createUseRouterDepth(routerKey)
  const useComponentsStore = createUseComponentsStore(routerKey)

  return defineComponent((props: RouterViewProps, context: SetupContext<EmitsOptions, SlotsType<RouterViewSlots>>) => {
    const route = useRoute()
    const router = useRouter()
    const rejection = useRejection()
    const depth = useRouterDepth({ increment: true })

    onServerPrefetch(async () => {
      await router.start()
    })

    const { getRouteComponents } = useComponentsStore()

    const component = computed(() => {
      if (!router.started.value) {
        return null
      }

      if (rejection.value) {
        return rejection.value.component
      }

      const match = route.matches.at(depth)

      if (!match) {
        return null
      }

      const components = getRouteComponents(match)
      const name = props.name ?? 'default'

      return components[name]
    })

    return () => {
      if (context.slots.default) {
        return context.slots.default({
          route,
          component,
          rejection: rejection.value,
        })
      }

      if (!component.value) {
        return null
      }

      return h(component.value)
    }
  }, {
    name: 'RouterView',
    // The prop types are defined above. Vue requires manually defining the prop names themselves here to distinguish from attrs
    // eslint-disable-next-line vue/require-prop-types
    props: ['name'],
  })
}
