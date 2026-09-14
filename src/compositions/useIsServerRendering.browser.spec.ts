import { createSSRApp, defineComponent, h } from 'vue'
import { expect, test } from 'vitest'
import { mount } from '@vue/test-utils'
import { useIsServerRendering } from '@/compositions/useIsServerRendering'

const component = defineComponent({
  setup() {
    const isServerRendering = useIsServerRendering()

    return () => h('div', String(isServerRendering))
  },
})

test('is false on the client', () => {
  const wrapper = mount({ render: () => h(component) })

  expect(wrapper.text()).toBe('false')
})

test('is false while hydrating through createSSRApp', () => {
  const element = document.createElement('div')

  element.innerHTML = '<div>true</div>'
  document.body.appendChild(element)

  createSSRApp({ render: () => h(component) }).mount(element)

  expect(element.textContent).toBe('false')
})
