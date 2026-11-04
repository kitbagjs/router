import { createResolvedRoute } from '@/services/createResolvedRoute'
import { getDataKey } from '@/services/getDataKey'
import { expect, onTestFinished, test, vi } from 'vitest'
import { createRouter } from '@/services/createRouter'
import { createRoute } from '@/services/createRoute'
import { payloadToScript, RouterPayload } from '@/services/payload'
import { withParams } from '@/services/withParams'
import { createRejection } from '@/services/createRejection'
import { z } from 'zod'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { useLoader } from '@/main'

function getServerKey(): string {
  const route = createResolvedRoute(createRoute({ name: 'home', path: '/' }))

  return getDataKey({ kind: 'loader', depth: 0, name: 'default', route })
}

function embed(payload: RouterPayload): void {
  document.body.innerHTML = payloadToScript(payload)
}

test('a payload for the initial url is adopted synchronously when the router starts', async () => {
  embed({
    kind: 'success',
    url: '/',
    values: [{ key: getServerKey(), encoded: JSON.stringify('from server') }],
  })

  const load = vi.fn(() => 'from client')
  const home = createRoute({ name: 'home', path: '/' }).addLoader(load)
  const router = createRouter([home], { initialUrl: '/' })

  expect(router.started.value).toBe(false)

  const ready = router.start()

  expect(router.route.name).toBe('home')
  expect(router.started.value).toBe(true)

  await ready

  expect(load).not.toHaveBeenCalled()
})

test('a payload whose route no longer matches rejects with NotFound', async () => {
  embed({ kind: 'success', url: '/gone', values: [] })

  const onRejection = vi.fn()
  const home = createRoute({ name: 'home', path: '/' })
  const router = createRouter([home], { initialUrl: '/gone' })

  router.onRejection(onRejection)

  await router.start()

  expect(onRejection).toHaveBeenCalledWith('NotFound', { to: null, from: null, remove: expect.any(Function) })
})

test('a payload with a rejection is adopted synchronously when the router starts', async () => {
  embed({ kind: 'reject', url: '/secret', rejection: 'Locked' })

  const locked = createRejection({ type: 'Locked', status: 423 })
  const onRejection = vi.fn()
  const secret = createRoute({ name: 'secret', path: '/secret' })
  const router = createRouter([secret], { initialUrl: '/secret', rejections: [locked] })

  router.onRejection(onRejection)

  const ready = router.start()

  expect(router.started.value).toBe(true)

  await ready

  expect(onRejection).toHaveBeenCalledWith('Locked', { to: expect.objectContaining({ name: 'secret' }), from: null, remove: expect.any(Function) })
})

test('a reject payload whose url no longer matches rejects with NotFound', async () => {
  embed({ kind: 'reject', url: '/gone', rejection: 'Locked' })

  const locked = createRejection({ type: 'Locked', status: 423 })
  const onRejection = vi.fn()
  const home = createRoute({ name: 'home', path: '/' })
  const router = createRouter([home], { initialUrl: '/gone', rejections: [locked] })

  router.onRejection(onRejection)

  await router.start()

  expect(onRejection).toHaveBeenCalledWith('NotFound', { to: null, from: null, remove: expect.any(Function) })
})

test('adopting a payload leaves the document title the server rendered', async () => {
  document.title = 'from server markup'

  embed({ kind: 'success', url: '/', values: [] })

  const title = vi.fn(() => 'from client')
  const home = createRoute({ name: 'home', path: '/' })

  home.setTitle(title)

  const router = createRouter([home], { initialUrl: '/' })

  await router.start()

  expect(document.title).toBe('from server markup')
  expect(title).not.toHaveBeenCalled()
})

test('a payload for a url with schema params is adopted synchronously when the router starts', async () => {
  embed({ kind: 'success', url: '/post/5', values: [] })

  const post = createRoute({ name: 'post', path: withParams('/post/[id]', { id: z.number() }) })
  const router = createRouter([post], { initialUrl: '/post/5' })

  const ready = router.start()

  expect(router.route.name).toBe('post')
  expect(router.route.params.id).toBe(5)
  expect(router.started.value).toBe(true)

  await ready
})

test('a value missing from the payload warns and computes again', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

  embed({ kind: 'success', url: '/', values: [] })

  const load = vi.fn(() => 'computed')
  const home = createRoute({ name: 'home', path: '/' }).addLoader(load)
  const router = createRouter([home], { initialUrl: '/' })

  await router.start()

  expect(load).toHaveBeenCalledOnce()
  expect(warn.mock.calls.some(([message]) => String(message).includes('loader "default"'))).toBe(true)

  warn.mockRestore()
})

test('a value is adopted through its own parse', async () => {
  embed({
    kind: 'success',
    url: '/',
    values: [{ key: getServerKey(), encoded: '[["a",1]]' }],
  })

  const load = vi.fn(() => new Map<string, number>())
  const parse = vi.fn((encoded: string) => new Map<string, number>(JSON.parse(encoded)))
  const home = createRoute({ name: 'home', path: '/' }).addLoader(load, {
    transformer: {
      stringify: (value) => JSON.stringify(Array.from(value.entries())),
      parse,
    },
  })
  const router = createRouter([home], { initialUrl: '/' })

  await router.start()

  expect(parse).toHaveBeenCalledExactlyOnceWith('[["a",1]]')
  expect(load).not.toHaveBeenCalled()
})

test('a declared payload option that cannot read a value warns and computes again', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

  embed({
    kind: 'success',
    url: '/',
    values: [{ key: getServerKey(), encoded: 'not what parse expects' }],
  })

  const load = vi.fn(() => 1)
  const home = createRoute({ name: 'home', path: '/' }).addLoader(load, {
    transformer: {
      stringify: String,
      parse: () => {
        throw new Error('nope')
      },
    },
  })

  const router = createRouter([home], { initialUrl: '/' })

  await router.start()

  expect(load).toHaveBeenCalledOnce()
  expect(warn.mock.calls.some(([message]) => String(message).includes('parse the payload value for loader "default"'))).toBe(true)

  warn.mockRestore()
})

test('hydration uses the initial history state when matching stored values', async () => {
  const previousState = window.history.state
  onTestFinished(() => window.history.replaceState(previousState, ''))
  window.history.replaceState({ usr: { page: '2' } }, '')

  const serverRoute = createResolvedRoute(createRoute({ name: 'home', path: '/', state: { page: Number } }), {}, { state: { page: 2 } })
  const key = getDataKey({ kind: 'loader', depth: 0, name: 'default', route: serverRoute })

  embed({
    kind: 'success',
    url: '/',
    values: [{ key, encoded: JSON.stringify('from server') }],
  })

  const load = vi.fn(() => 'from client')
  const home = createRoute({ name: 'home', path: '/', state: { page: Number } }).addLoader(load)
  const router = createRouter([home], { initialUrl: '/' })
  onTestFinished(() => router.stop())

  await router.start()

  expect(router.route.state.page).toBe(2)
  expect(load).not.toHaveBeenCalled()
})

test.each([
  { initialUrl: '/#details', state: undefined },
  { initialUrl: '/', state: { page: '2' } },
  { initialUrl: '/#details', state: { page: '2' } },
])('adopts a rendered payload with browser-only inputs: %j', async ({ initialUrl, state }) => {
  const previousState = window.history.state
  const previousUrl = window.location.href
  onTestFinished(() => window.history.replaceState(previousState, '', previousUrl))
  window.history.replaceState(null, '', '/')
  document.body.innerHTML = ''

  const serverRoute = createRoute({ name: 'home', path: '/', state: { page: Number } }).addLoader(() => 'from server')
  const server = createRouter([serverRoute], { ssr: true, initialUrl: '/' })
  onTestFinished(() => server.stop())
  const rendered = await server.render()

  if (rendered.kind !== 'success') {
    throw new Error('Expected a successful server render')
  }

  document.body.innerHTML = rendered.payload
  window.history.replaceState({ usr: state }, '', '/')

  const load = vi.fn(() => 'from client')
  const clientRoute = createRoute({ name: 'home', path: '/', state: { page: Number } }).addLoader(load)
  const client = createRouter([clientRoute], { initialUrl })
  onTestFinished(() => client.stop())

  await client.start()

  const wrapper = mount(defineComponent({
    setup() {
      const { data } = useLoader(client.route.loaders.default)

      return () => h('p', data.value)
    },
  }), { global: { plugins: [client] } })

  expect(wrapper.text()).toBe('from server')
  expect(load).not.toHaveBeenCalled()
})
