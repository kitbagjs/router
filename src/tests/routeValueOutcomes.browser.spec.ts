import { flushPromises, mount } from '@vue/test-utils'
import { expect, test, vi } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { createRejection } from '@/services/createRejection'

test.each([
  ['props', 'reject'],
  ['props', 'push'],
  ['props', 'error'],
  ['loader', 'reject'],
  ['loader', 'push'],
  ['loader', 'error'],
] as const)('a late %s %s cannot replace a direct rejection', async (source, outcome) => {
  const ready = Promise.withResolvers<void>()
  const other = createRoute({ name: 'other', path: '/other' })
  const denied = createRejection({ type: 'Denied', component: { template: '<div>denied</div>' } })
  const home = createRoute({ name: 'home', path: '/', context: [other] })
  const callback = async (_route: unknown, { reject, push }: {
    reject: (type: 'NotFound') => void,
    push: (name: 'other') => unknown,
  }): Promise<{}> => {
    await ready.promise

    switch (outcome) {
      case 'reject':
        reject('NotFound')
        break
      case 'push':
        push('other')
        break
      case 'error':
        throw new Error('late failure')
    }

    return {}
  }

  const route = source === 'props'
    ? home.addView({ template: '<div>home</div>' }, { props: callback })
    : home.addLoader(callback)

  const router = createRouter([route], { initialUrl: '/', historyMode: 'memory', rejections: [denied] })
  const onRejection = vi.fn()
  const onError = vi.fn((_error, { reject }) => reject('NotFound'))
  router.onRejection(onRejection)
  router.onError(onError)
  const wrapper = mount({ template: '<RouterView />' }, { global: { plugins: [router] } })

  try {
    await router.start()
    router.reject('Denied')
    await flushPromises()
    expect(wrapper.text()).toBe('denied')

    ready.resolve()
    await flushPromises()

    expect(wrapper.text()).toBe('denied')
    expect(router.route.name).toBe('home')
    expect(onRejection).toHaveBeenCalledExactlyOnceWith('Denied', { to: null, from: null })
    expect(onError).not.toHaveBeenCalled()
  } finally {
    ready.resolve()
    router.stop()
    wrapper.unmount()
  }
})
