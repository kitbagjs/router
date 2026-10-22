import { expect, test, vi } from 'vitest'
import { createRouter } from '@/services/createRouter'
import { createRoute } from '@/services/createRoute'
import { payloadToScript, RouterPayload } from '@/services/payload'
import { withParams } from '@/services/withParams'
import { createRejection } from '@/services/createRejection'
import { z } from 'zod'

function embed(payload: RouterPayload): void {
  document.body.innerHTML = payloadToScript(payload)
}

test('a payload for the initial url is adopted synchronously when the router starts', async () => {
  embed({
    kind: 'success',
    url: '/',
    values: [{ kind: 'loader', depth: 0, name: 'default', encoded: JSON.stringify('from server') }],
  })

  const load = vi.fn(() => 'from client')
  const home = createRoute({ name: 'home', path: '/' }).addLoader(load)
  const router = createRouter([home], { initialUrl: '/' })

  expect(router.started.value).toBe(false)

  const ready = router.start()

  expect(router.route.name).toBe('home')
  expect(router.started.value).toBe(true)

  await ready

  await expect(router.route.data).resolves.toBe('from server')
  expect(load).not.toHaveBeenCalled()
})

test('a payload whose route no longer matches rejects with NotFound', async () => {
  embed({ kind: 'success', url: '/gone', values: [] })

  const onRejection = vi.fn()
  const home = createRoute({ name: 'home', path: '/' })
  const router = createRouter([home], { initialUrl: '/gone' })

  router.onRejection(onRejection)

  await router.start()

  expect(onRejection).toHaveBeenCalledWith('NotFound', { to: null, from: null })
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

  expect(onRejection).toHaveBeenCalledWith('Locked', { to: expect.objectContaining({ name: 'secret' }), from: null })
})

test('a reject payload whose url no longer matches rejects with NotFound', async () => {
  embed({ kind: 'reject', url: '/gone', rejection: 'Locked' })

  const locked = createRejection({ type: 'Locked', status: 423 })
  const onRejection = vi.fn()
  const home = createRoute({ name: 'home', path: '/' })
  const router = createRouter([home], { initialUrl: '/gone', rejections: [locked] })

  router.onRejection(onRejection)

  await router.start()

  expect(onRejection).toHaveBeenCalledWith('NotFound', { to: null, from: null })
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

  const home = createRoute({ name: 'home', path: '/' }).addLoader(() => 'computed')
  const router = createRouter([home], { initialUrl: '/' })

  await router.start()

  await expect(router.route.data).resolves.toBe('computed')
  expect(warn.mock.calls.some(([message]) => String(message).includes('loader "default"'))).toBe(true)

  warn.mockRestore()
})

test('a value is adopted through its own parse', async () => {
  embed({
    kind: 'success',
    url: '/',
    values: [{ kind: 'loader', depth: 0, name: 'default', encoded: '[["a",1]]' }],
  })

  const load = vi.fn(() => new Map<string, number>())
  const home = createRoute({ name: 'home', path: '/' }).addLoader(load, {
    transformer: {
      stringify: (value) => JSON.stringify(Array.from(value.entries())),
      parse: (encoded) => new Map(JSON.parse(encoded)),
    },
  })
  const router = createRouter([home], { initialUrl: '/' })

  await router.start()

  await expect(router.route.data).resolves.toEqual(new Map([['a', 1]]))
  expect(load).not.toHaveBeenCalled()
})

test('a declared payload option that cannot read a value warns and computes again', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

  embed({
    kind: 'success',
    url: '/',
    values: [{ kind: 'loader', depth: 0, name: 'default', encoded: 'not what parse expects' }],
  })

  const home = createRoute({ name: 'home', path: '/' }).addLoader(() => 1, {
    transformer: {
      stringify: String,
      parse: () => {
        throw new Error('nope')
      },
    },
  })

  const router = createRouter([home], { initialUrl: '/' })

  await router.start()

  await expect(router.route.data).resolves.toBe(1)
  expect(warn.mock.calls.some(([message]) => String(message).includes('parse the payload value for loader "default"'))).toBe(true)

  warn.mockRestore()
})
