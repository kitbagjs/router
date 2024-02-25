import { AsyncComponentLoader, InjectionKey, computed, defineAsyncComponent, defineComponent, h, provide, resolveComponent, defineSlots, DeepReadonly } from 'vue'
import { useRejection } from '@/compositions/useRejection'
import { useRouter } from '@/compositions/useRouter'
import { useRouterDepth } from '@/compositions/useRouterDepth'
import { ResolvedRoute, RouteComponent } from '@/types'

export const depthInjectionKey: InjectionKey<number> = Symbol()

export default defineComponent({
  name: 'RouterView',
  expose: [],
  setup() {
    const slots = defineSlots<{
      default?: (props: {
        route: DeepReadonly<ResolvedRoute>,
        component: RouteComponent,
      }) => unknown,
    }>()

    const router = useRouter()
    const rejection = useRejection()
    const depth = useRouterDepth()
    const routerView = resolveComponent('RouterView', true)

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

    return () => {
      if (rejection.value) {
        return h(rejection.value.component)
      }

      if (slots.default) {
        return slots.default({ component, route: router.route })
      }

      // might be able to use onVnodeMounted here to inform router that the last component has been mounted in the route matches
      return h(component.value)
    }
  },
})