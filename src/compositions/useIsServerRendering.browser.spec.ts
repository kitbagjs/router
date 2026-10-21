/* eslint-disable vue/one-component-per-file */
import { createSSRApp, defineComponent, h } from 'vue'
import { expect, test, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { renderToString } from 'vue/server-renderer'
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

test('is false while hydrating through createSSRApp', async () => {
  const observed = vi.fn()
  const hydrationComponent = defineComponent({
    setup() {
      observed(useIsServerRendering())

      return () => h('div', 'hydrated')
    },
  })
  const element = document.createElement('div')

  element.innerHTML = await renderToString(createSSRApp(hydrationComponent))

  expect(observed).toHaveBeenCalledExactlyOnceWith(true)
  observed.mockClear()

  const serverNode = element.firstChild
  const app = createSSRApp(hydrationComponent)
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})

  document.body.appendChild(element)

  try {
    app.mount(element)

    expect(observed).toHaveBeenCalledExactlyOnceWith(false)
    expect(element.textContent).toBe('hydrated')
    expect(element.firstChild).toBe(serverNode)
    expect(warn).not.toHaveBeenCalled()
    expect(error).not.toHaveBeenCalled()
  } finally {
    app.unmount()
    element.remove()
    warn.mockRestore()
    error.mockRestore()
  }
})
