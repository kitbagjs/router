import { InjectionKey, computed, defineComponent, h, inject, provide, resolveComponent } from 'vue'
import { loadRoute, routerInjectionKey } from '@/utilities'

const depthInjectionKey: InjectionKey<number> = Symbol()

export default defineComponent({
  name: 'RouterView',
  expose: [],
  setup() {
    const router = inject(routerInjectionKey)
    const depth = inject(depthInjectionKey, 0)

    if (!router) {
      throw new Error('Router not installed')
    }

    provide(depthInjectionKey, depth + 1)

    const routerView = resolveComponent('RouterView')

    const component = computed(() => {
      const route = router.route.matches[depth]

      return route.component ?? routerView
    })

    return () => h(component.value)
  },
})