import { AsyncComponentLoader, InjectionKey, computed, defineAsyncComponent, defineComponent, h, inject, provide, resolveComponent } from 'vue'
import { routerInjectionKey } from '@/utilities'

const depthInjectionKey: InjectionKey<number> = Symbol()

export default defineComponent({
  name: 'RouterView',
  expose: [],
  setup() {
    const router = inject(routerInjectionKey)
    const depth = inject(depthInjectionKey, 0)
    const routerView = resolveComponent('RouterView')

    if (!router) {
      throw new Error('Router not installed')
    }

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

    return () => h(component.value)
  },
})