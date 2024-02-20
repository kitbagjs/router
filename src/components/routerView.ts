import { AsyncComponentLoader, InjectionKey, computed, defineAsyncComponent, defineComponent, h, provide, resolveComponent } from 'vue'
import { useRejection } from '@/compositions/useRejection'
import { useRouter } from '@/compositions/useRouter'
import { useRouterDepth } from '@/compositions/useRouterDepth'

export const depthInjectionKey: InjectionKey<number> = Symbol()

export default defineComponent({
  name: 'RouterView',
  expose: [],
  setup() {
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

      return h(component.value)
    }
  },
})