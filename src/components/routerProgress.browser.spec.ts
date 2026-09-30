import { flushPromises, mount, VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { nextTick } from 'vue'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { component } from '@/utilities/testHelpers'

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] })
})

afterEach(() => {
  vi.useRealTimers()
})

type Outcome = 'complete' | 'abort' | 'reject'

type Pending = {
  wrapper: VueWrapper,
  settle: (count?: number) => Promise<void>,
  end: (outcome: Outcome) => Promise<void>,
}

/**
 * Mounts a bar over a router whose initial navigation waits on two before hooks that settle on demand, and
 * a third that decides how the navigation ends.
 */
function mountPendingBar(template = '<RouterProgress />'): Pending {
  const first = Promise.withResolvers<string>()
  const second = Promise.withResolvers<string>()
  const outcome = Promise.withResolvers<Outcome>()
  const home = createRoute({ name: 'home', path: '/', component })

  home.onBeforeRouteEnter(async () => {
    await first.promise
  })
  home.onBeforeRouteEnter(async () => {
    await second.promise
  })
  home.onBeforeRouteEnter(async (_to, { abort, reject }) => {
    const result = await outcome.promise

    if (result === 'abort') {
      abort()
    }

    if (result === 'reject') {
      reject('NotFound')
    }
  })

  const router = createRouter([home], { initialUrl: '/' })

  const wrapper = mount({ template }, {
    global: {
      plugins: [router],
    },
  })

  const resolvers = [first, second]

  return {
    wrapper,
    settle: async (count = 1) => {
      resolvers.splice(0, count).forEach((resolver) => resolver.resolve('ok'))
      await flushPromises()
      await nextTick()
    },
    end: async (result) => {
      outcome.resolve(result)
      await flushPromises()
      await nextTick()
    },
  }
}

async function advance(ms: number): Promise<void> {
  vi.advanceTimersByTime(ms)
  await nextTick()
}

function style(wrapper: VueWrapper, selector: string): CSSStyleDeclaration {
  return (wrapper.find(selector).element as HTMLElement).style
}

function rendered(wrapper: VueWrapper): boolean {
  return wrapper.find('.router-progress').exists()
}

function width(wrapper: VueWrapper): number {
  return Number.parseInt(style(wrapper, '.router-progress__bar').width)
}

function opacity(wrapper: VueWrapper): string {
  return style(wrapper, '.router-progress').opacity
}

test('a navigation that ends before the delay never shows the bar', async () => {
  const { wrapper, settle, end } = mountPendingBar()

  await advance(100)
  await settle(2)
  await end('complete')
  await advance(1000)

  expect(rendered(wrapper)).toBe(false)
})

test('a navigation still pending after the delay shows the bar', async () => {
  const { wrapper } = mountPendingBar()

  await advance(149)

  expect(rendered(wrapper)).toBe(false)

  await advance(1)

  expect(opacity(wrapper)).toBe('1')
  expect(width(wrapper)).toBe(5)
})

test('the delay prop decides how long before the bar shows', async () => {
  const { wrapper } = mountPendingBar('<RouterProgress :delay="500" />')

  await advance(400)

  expect(rendered(wrapper)).toBe(false)

  await advance(100)

  expect(rendered(wrapper)).toBe(true)
})

test('a unit settling moves the bar to the real progress', async () => {
  const { wrapper, settle } = mountPendingBar()

  await advance(150)
  await settle()

  expect(width(wrapper)).toBe(33)
})

test('the bar creeps toward the next unit while waiting, without reaching it', async () => {
  const { wrapper } = mountPendingBar()

  await advance(150)

  const before = width(wrapper)

  await advance(1000)

  const after = width(wrapper)

  expect(after).toBeGreaterThan(before)
  expect(after).toBeLessThan(33)
})

test('a unit settling snaps the bar forward from wherever it crept to', async () => {
  const { wrapper, settle } = mountPendingBar()

  await advance(1500)

  const crept = width(wrapper)

  await settle()

  expect(width(wrapper)).toBe(33)
  expect(width(wrapper)).toBeGreaterThan(crept)
})

test('a completed navigation fills the bar and fades it once the fill has landed', async () => {
  const { wrapper, settle, end } = mountPendingBar()

  await advance(150)
  await settle(2)
  await end('complete')

  expect(width(wrapper)).toBe(100)
  expect(opacity(wrapper)).toBe('0')
  expect(style(wrapper, '.router-progress').transition).toContain('400ms')
})

test('an aborted navigation removes the bar at once without filling it', async () => {
  const { wrapper, end } = mountPendingBar()

  await advance(150)

  expect(rendered(wrapper)).toBe(true)

  await end('abort')

  expect(rendered(wrapper)).toBe(false)
})

test('a rejected navigation removes the bar the same way', async () => {
  const { wrapper, end } = mountPendingBar()

  await advance(150)
  await end('reject')

  expect(rendered(wrapper)).toBe(false)
})

test('the color prop sets the color of the bar', async () => {
  const { wrapper } = mountPendingBar('<RouterProgress color="tomato" />')

  await advance(150)

  expect(style(wrapper, '.router-progress__bar').background).toBe('tomato')
})

test('the bar is labelled for screen readers, with the label prop overriding the default', async () => {
  const { wrapper } = mountPendingBar()
  const { wrapper: labelled } = mountPendingBar('<RouterProgress label="Chargement" />')

  await advance(150)

  expect(wrapper.find('.router-progress').attributes('aria-label')).toBe('Loading page')
  expect(labelled.find('.router-progress').attributes('aria-label')).toBe('Chargement')
})

test('a navigation begun while another is pending starts the bar over', async () => {
  const hook = Promise.withResolvers<string>()
  const home = createRoute({ name: 'home', path: '/', component })
  const other = createRoute({ name: 'other', path: '/other', component })

  home.onBeforeRouteEnter(async () => {
    await hook.promise
  })
  other.onBeforeRouteEnter(async () => {
    await hook.promise
  })

  const router = createRouter([home, other], { initialUrl: '/' })
  const wrapper = mount({ template: '<RouterProgress />' }, {
    global: {
      plugins: [router],
    },
  })

  await advance(1500)

  const crept = width(wrapper)

  router.push('/other')
  await nextTick()

  expect(rendered(wrapper)).toBe(false)

  await advance(150)

  expect(width(wrapper)).toBeLessThan(crept)
})
