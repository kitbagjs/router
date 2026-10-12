import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeAll, expect, test, vi } from 'vitest'
import { register } from 'view-transitions-mock'
import { ViewTransition } from '@/components/viewTransition'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'

beforeAll(() => {
  vi.spyOn(console, 'info').mockImplementation(() => {})
  register({ forced: true })
})

afterEach(async () => {
  const transition = document.activeViewTransition
  transition?.skipTransition()
  await transition?.finished
  vi.restoreAllMocks()
})

test('names the requested element and preserves its attributes, styles and content', async () => {
  const wrapper = mount(ViewTransition, {
    props: { name: 'photo', as: 'figure' },
    attrs: { class: 'preview', style: { color: 'red' } },
    slots: { default: 'Photo' },
  })

  expect(wrapper.element.tagName).toBe('FIGURE')
  expect(wrapper.classes()).toContain('preview')
  expect(wrapper.element.style.color).toBe('red')
  expect(wrapper.element.style.viewTransitionName).toBe('photo')
  expect(wrapper.text()).toBe('Photo')

  await wrapper.setProps({ name: 'avatar' })

  expect(wrapper.element.style.viewTransitionName).toBe('avatar')
  wrapper.unmount()
})

test('names only the destination link before capture and names the destination element', async () => {
  const loaded = Promise.withResolvers<void>()
  const gallery = createRoute({
    name: 'gallery',
    path: '/',
    component: {
      template: `
        <RouterLink to="/photo"><ViewTransition name="photo" as="img" src="thumb.jpg" /></RouterLink>
        <RouterLink to="/other"><ViewTransition name="photo" as="img" src="other.jpg" /></RouterLink>
      `,
    },
  })
  const photo = createRoute({
    name: 'photo',
    path: '/photo',
    component: { template: '<ViewTransition name="photo" as="img" src="full.jpg" />' },
  }).addLoader(() => loaded.promise)
  const router = createRouter([gallery, photo], { initialUrl: '/', historyMode: 'memory', viewTransition: true })
  const wrapper = mount({ template: '<RouterView />' }, { global: { plugins: [router] } })
  await router.start()
  await flushPromises()

  const names = (): string[] => wrapper.findAll('img').map(({ element }) => element.style.viewTransitionName)
  expect(names()).toEqual(['none', 'none'])

  const capture = vi.fn()
  const start = document.startViewTransition.bind(document)
  vi.spyOn(document, 'startViewTransition').mockImplementation((options) => {
    capture(names())
    return start(options)
  })

  const navigation = router.push('photo')
  await flushPromises()

  expect(names()).toEqual(['photo', 'none'])
  loaded.resolve()
  await navigation

  expect(capture).toHaveBeenCalledWith(['photo', 'none'])
  expect(names()).toEqual(['photo'])
  expect(wrapper.find('img').attributes('src')).toBe('full.jpg')
  wrapper.unmount()
})

test('canceling preparation removes the link element name', async () => {
  const home = createRoute({
    name: 'home',
    path: '/',
    component: { template: '<RouterLink to="/photo"><ViewTransition name="photo" as="img" /></RouterLink>' },
  })
  const photo = createRoute({ name: 'photo', path: '/photo' }).addLoader(() => new Promise(() => {}))
  const router = createRouter([home, photo], { initialUrl: '/', historyMode: 'memory', viewTransition: true })
  const wrapper = mount({ template: '<RouterView />' }, { global: { plugins: [router] } })
  await router.start()
  await flushPromises()

  const navigation = router.push('photo')
  await flushPromises()
  expect(wrapper.find('img').element.style.viewTransitionName).toBe('photo')

  router.stop()
  await navigation
  await flushPromises()

  expect(wrapper.find('img').element.style.viewTransitionName).toBe('none')
  wrapper.unmount()
})
