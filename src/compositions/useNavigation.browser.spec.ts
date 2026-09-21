import { flushPromises, mount } from '@vue/test-utils'
import { expect, test } from 'vitest'
import { defineComponent, h } from 'vue'
import { useNavigation, useNavigationProgress } from '@/main'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { payloadToScript } from '@/services/payload'
import { component } from '@/utilities/testHelpers'

const progressReport = defineComponent(() => {
  const { pending, to } = useNavigation()
  const { settled, total, progress } = useNavigationProgress()

  return () => h('div', `${pending.value} ${to.value?.name ?? 'idle'} ${settled.value}/${total.value} ${progress.value}`)
})

test('the values update through a navigation', async () => {
  const hook = Promise.withResolvers<string>()
  const loader = Promise.withResolvers<string>()
  const home = createRoute({ name: 'home', path: '/', component }).addLoader(() => loader.promise)

  home.onBeforeRouteEnter(async () => {
    await hook.promise
  })

  const router = createRouter([home], { initialUrl: '/' })

  const wrapper = mount(progressReport, {
    global: {
      plugins: [router],
    },
  })

  expect(wrapper.text()).toBe('true home 0/2 0')

  hook.resolve('ok')
  await flushPromises()

  expect(wrapper.text()).toBe('true home 1/2 0.5')

  loader.resolve('data')
  await flushPromises()

  expect(wrapper.text()).toBe('false idle 2/2 0')
})

test('a hydrating navigation counts nothing', async () => {
  document.body.innerHTML = payloadToScript({
    kind: 'success',
    url: '/',
    values: [{ kind: 'loader', depth: 0, name: 'default', encoded: JSON.stringify('from server') }],
  })

  const home = createRoute({ name: 'home', path: '/', component }).addLoader(() => 'from client')
  const router = createRouter([home], { initialUrl: '/' })

  const wrapper = mount(progressReport, {
    global: {
      plugins: [router],
    },
  })

  expect(wrapper.text()).toBe('false idle 0/0 0')

  await flushPromises()

  expect(router.route.name).toBe('home')
  expect(wrapper.text()).toBe('false idle 0/0 0')
})
