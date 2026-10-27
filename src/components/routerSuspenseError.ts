import { defineComponent, h } from 'vue'

export const RouterSuspenseError = defineComponent({
  name: 'RouterSuspenseError',
  setup() {
    return () => h('p', { role: 'alert' }, 'Unable to load this content.')
  },
})
