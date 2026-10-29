import { expect, test, vi } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { component } from '@/utilities/testHelpers'
import { createRouter } from '@/services/createRouter'
import { createRejection } from '@/services/createRejection'
import { flushPromises } from '@vue/test-utils'

test('route with title updates document title', async () => {
  const route = createRoute({
    name: 'root',
    path: '/',
  })
    .addView(component)

  const title = 'foo'
  const callback = vi.fn(() => title)

  route.setTitle(callback)

  const router = createRouter([route], {
    initialUrl: '/',
  })

  await router.start()

  await flushPromises()

  expect(callback).toHaveBeenCalledTimes(1)
  expect(document.title).toBe(title)
})

test('route with title and parent with title does not call parent getTitle', async () => {
  const parent = createRoute({
    name: 'parent',
    path: '/parent',
  })
    .addView(component)
  const parentGetTitle = vi.fn(() => 'parent')
  parent.setTitle(parentGetTitle)

  const child = createRoute({
    name: 'child',
    path: '/child',
    parent,
  })
    .addView(component)

  const childGetTitle = vi.fn(() => 'child')
  child.setTitle(childGetTitle)

  const router = createRouter([parent, child], {
    initialUrl: '/parent/child',
  })

  await router.start()

  await flushPromises()

  expect(parentGetTitle).not.toHaveBeenCalled()
  expect(childGetTitle).toHaveBeenCalledTimes(1)
  expect(document.title).toBe('child')
})

test('route with title and parent with title does call parent getTitle when called directly', async () => {
  const parent = createRoute({
    name: 'parent',
    path: '/parent',
  })
    .addView(component)

  const parentGetTitle = vi.fn(() => 'parent')
  parent.setTitle(parentGetTitle)

  const child = createRoute({
    name: 'child',
    path: '/child',
    parent,
  })
    .addView(component)

  const childGetTitle = vi.fn(async (_to, { getParentTitle }) => {
    const parentTitle = await getParentTitle()
    return `${parentTitle} - child`
  })

  child.setTitle(childGetTitle)

  const router = createRouter([parent, child], {
    initialUrl: '/parent/child',
  })

  await router.start()

  await flushPromises()

  expect(parentGetTitle).toHaveBeenCalledTimes(1)
  expect(childGetTitle).toHaveBeenCalledTimes(1)
  expect(document.title).toBe('parent - child')
})

test('route with title and parent with title does call parent getTitle when called directly', async () => {
  const parent = createRoute({
    name: 'parent',
    path: '/parent',
  })
    .addView(component)

  const parentGetTitle = vi.fn(() => 'parent')
  parent.setTitle(parentGetTitle)

  const child = createRoute({
    name: 'child',
    path: '/child',
    parent,
  })
    .addView(component)

  const grandchild = createRoute({
    name: 'grandchild',
    path: '/grandchild',
    parent: child,
  })
    .addView(component)

  const grandchildGetTitle = vi.fn(async (_to, { getParentTitle }) => {
    const parentTitle = await getParentTitle()
    return `${parentTitle} - grandchild`
  })

  grandchild.setTitle(grandchildGetTitle)

  const router = createRouter([parent, child, grandchild], {
    initialUrl: '/parent/child/grandchild',
  })

  await router.start()

  await flushPromises()

  expect(parentGetTitle).toHaveBeenCalledTimes(1)
  expect(grandchildGetTitle).toHaveBeenCalledTimes(1)
  expect(document.title).toBe('parent - grandchild')
})

test('route without title and parent with title updates document title', async () => {
  const parent = createRoute({
    name: 'parent',
    path: '/parent',
  })
    .addView(component)

  parent.setTitle(() => 'parent')

  const child = createRoute({
    name: 'child',
    path: '/child',
    parent,
  })
    .addView(component)

  const router = createRouter([parent, child], {
    initialUrl: '/parent/child',
  })

  await router.start()

  await flushPromises()

  expect(document.title).toBe('parent')
})

test('rejection from a hook updates document title', async () => {
  const locked = createRejection({ type: 'Locked', status: 423, component })

  const callback = vi.fn(() => 'locked')
  locked.setTitle(callback)

  const home = createRoute({ name: 'home', path: '/' }).addView(component)
  const secret = createRoute({ name: 'secret', path: '/secret' }).addView(component)

  const router = createRouter([home, secret], {
    initialUrl: '/',
    rejections: [locked],
  })

  router.onBeforeRouteEnter((to, { reject }) => {
    if (to.name === 'secret') {
      reject('Locked')
    }
  })

  await router.start()
  await router.push('secret')
  await flushPromises()

  expect(document.title).toBe('locked')
  expect(callback).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ name: 'Locked' }), {
    getParentTitle: expect.any(Function),
  })
})

test('rejection without a title in a before hook keeps the current route title', async () => {
  const locked = createRejection({ type: 'Locked', status: 423, component })

  const home = createRoute({ name: 'home', path: '/' }).addView(component)
  const secret = createRoute({ name: 'secret', path: '/secret' }).addView(component)

  home.setTitle(() => 'home')
  secret.setTitle(() => 'secret')

  const router = createRouter([home, secret], {
    initialUrl: '/',
    rejections: [locked],
  })

  router.onBeforeRouteEnter((to, { reject }) => {
    if (to.name === 'secret') {
      reject('Locked')
    }
  })

  await router.start()
  await flushPromises()
  await router.push('secret')
  await flushPromises()

  expect(document.title).toBe('home')
})

test('rejection without a title in an after hook falls back to the current route title', async () => {
  const locked = createRejection({ type: 'Locked', status: 423, component })

  const home = createRoute({ name: 'home', path: '/' }).addView(component)
  const secret = createRoute({ name: 'secret', path: '/secret' }).addView(component)

  secret.setTitle(() => 'secret')

  const router = createRouter([home, secret], {
    initialUrl: '/',
    rejections: [locked],
  })

  router.onAfterRouteEnter((to, { reject }) => {
    if (to.name === 'secret') {
      reject('Locked')
    }
  })

  await router.start()
  await router.push('secret')
  await flushPromises()

  expect(document.title).toBe('secret')
})

test('rejection with a title wins over the current route title', async () => {
  const locked = createRejection({ type: 'Locked', status: 423, component })

  locked.setTitle(() => 'locked')

  const home = createRoute({ name: 'home', path: '/' }).addView(component)
  const secret = createRoute({ name: 'secret', path: '/secret' }).addView(component)

  secret.setTitle(() => 'secret')

  const router = createRouter([home, secret], {
    initialUrl: '/',
    rejections: [locked],
  })

  router.onBeforeRouteEnter((to, { reject }) => {
    if (to.name === 'secret') {
      reject('Locked')
    }
  })

  await router.start()
  await router.push('secret')
  await flushPromises()

  expect(document.title).toBe('locked')
})

test('a slow title from a previous route does not overwrite the current title', async () => {
  const slowTitle = Promise.withResolvers<string>()

  const home = createRoute({ name: 'home', path: '/' }).addView(component)
  const slow = createRoute({ name: 'slow', path: '/slow' }).addView(component)
  const fast = createRoute({ name: 'fast', path: '/fast' }).addView(component)

  slow.setTitle(() => slowTitle.promise)
  fast.setTitle(() => 'fast')

  const router = createRouter([home, slow, fast], {
    initialUrl: '/',
  })

  await router.start()
  await router.push('/slow')
  await router.push('/fast')
  await flushPromises()

  expect(document.title).toBe('fast')

  slowTitle.resolve('slow')
  await flushPromises()

  expect(document.title).toBe('fast')
})

test('title callbacks receive the destination and only getParentTitle in the context', async () => {
  const home = createRoute({ name: 'home', path: '/' }).addView(component)
  const about = createRoute({ name: 'about', path: '/about' }).addView(component)
  const callback = vi.fn(() => 'About')
  about.setTitle(callback)

  const router = createRouter([home, about], { initialUrl: '/' })

  await router.start()
  await router.push('about')
  await flushPromises()

  expect(callback).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ name: 'about' }), {
    getParentTitle: expect.any(Function),
  })
  expect(document.title).toBe('About')

  callback.mockClear()
  await router.route.getTitle()

  expect(callback).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ name: 'about' }), {
    getParentTitle: expect.any(Function),
  })
})

test('initial title callbacks only provide getParentTitle in the context', async () => {
  const home = createRoute({ name: 'home', path: '/' }).addView(component)
  const callback = vi.fn(() => 'Home')
  home.setTitle(callback)

  const router = createRouter([home], { initialUrl: '/' })

  await router.start()
  await flushPromises()

  expect(callback).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ name: 'home' }), {
    getParentTitle: expect.any(Function),
  })
})

test.each(['fallback', 'composition'] as const)('parent titles only provide getParentTitle in the context through %s', async (mode) => {
  const home = createRoute({ name: 'home', path: '/' }).addView(component)
  const parent = createRoute({ name: 'parent', path: '/parent' }).addView(component)
  const child = createRoute({ name: 'child', path: '/child', parent }).addView(component)
  const parentCallback = vi.fn(() => 'Parent')
  parent.setTitle(parentCallback)

  if (mode === 'composition') {
    child.setTitle(async (_to, { getParentTitle }) => `${await getParentTitle()} - Child`)
  }

  const router = createRouter([home, parent, child], { initialUrl: '/' })

  await router.start()
  await router.push('child')
  await flushPromises()

  expect(parentCallback).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ name: 'child' }), {
    getParentTitle: expect.any(Function),
  })
  expect(document.title).toBe(mode === 'composition' ? 'Parent - Child' : 'Parent')
})
