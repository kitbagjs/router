import { expect, test, vi } from 'vitest'
import { createRouter } from '@/services/createRouter'
import { createRoute } from '@/services/createRoute'
import { payloadToScript, RouterPayload } from '@/services/payload'
import { withParams } from '@/services/withParams'
import { z } from 'zod'

function embed(payload: RouterPayload): void {
  document.body.innerHTML = payloadToScript(payload)
}

test('a payload for the initial url is adopted synchronously when the router starts', async () => {
  embed({
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
  embed({ url: '/gone', values: [] })

  const onRejection = vi.fn()
  const home = createRoute({ name: 'home', path: '/' })
  const router = createRouter([home], { initialUrl: '/gone' })

  router.onRejection(onRejection)

  await router.start()

  expect(onRejection).toHaveBeenCalledWith('NotFound', { to: null, from: null })
})

test('a payload with a rejection is adopted synchronously when the router starts', async () => {
  embed({ url: '/nope', rejection: 'NotFound', values: [] })

  const onRejection = vi.fn()
  const home = createRoute({ name: 'home', path: '/' })
  const router = createRouter([home], { initialUrl: '/nope' })

  router.onRejection(onRejection)

  const ready = router.start()

  expect(router.started.value).toBe(true)

  await ready

  expect(onRejection).toHaveBeenCalledWith('NotFound', { to: null, from: null })
})

test('adopting a payload leaves the document title the server rendered', async () => {
  document.title = 'from server markup'

  embed({ url: '/', values: [] })

  const title = vi.fn(() => 'from client')
  const home = createRoute({ name: 'home', path: '/' })

  home.setTitle(title)

  const router = createRouter([home], { initialUrl: '/' })

  await router.start()

  expect(document.title).toBe('from server markup')
  expect(title).not.toHaveBeenCalled()
})

test('a payload for a url with schema params is adopted synchronously when the router starts', async () => {
  embed({ url: '/post/5', values: [] })

  const post = createRoute({ name: 'post', path: withParams('/post/[id]', { id: z.number() }) })
  const router = createRouter([post], { initialUrl: '/post/5' })

  const ready = router.start()

  expect(router.route.name).toBe('post')
  expect(router.route.params.id).toBe(5)
  expect(router.started.value).toBe(true)

  await ready
})
