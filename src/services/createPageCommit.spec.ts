import { expect, test, vi } from 'vitest'
import { Component, defineAsyncComponent } from 'vue'
import { createRoute } from '@/services/createRoute'
import { createRejection } from '@/services/createRejection'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { createRoutePage, createRejectionPage } from '@/services/createPage'
import { createPageCommit } from '@/services/createPageCommit'
import { createRouteValueStore } from '@/services/createRouteValueStore'
import { createComponentsStore } from '@/services/createComponentsStore'
import { isRejection } from '@/types/rejection'

test('preparation reports a rejection without waiting for unrelated page assets', async () => {
  const component = Promise.withResolvers<Component>()
  const data = Promise.withResolvers<void>()
  const route = createRoute({ name: 'route', path: '/' })
    .addView(defineAsyncComponent(() => component.promise))
    .addLoader((_route, { reject }) => reject('NotFound'))
    .addLoader(() => data.promise, { name: 'pending' })
  const page = createRoutePage(createResolvedRoute(route), createComponentsStore(Symbol()), createRouteValueStore())
  const update = vi.fn()
  const commit = createPageCommit({ page, signal: new AbortController().signal, update, settle: (response) => response })

  try {
    await expect(commit.prepare()).resolves.toEqual({ status: 'REJECT', type: 'NotFound' })
    await expect(commit.commit()).resolves.toBe(false)
    expect(update).not.toHaveBeenCalled()
  } finally {
    component.resolve({})
    data.resolve()
  }
})

test('a canceled rejection preparation cannot commit its lazy page', async () => {
  const component = Promise.withResolvers<Component>()
  const load = vi.fn(() => component.promise)
  const rejection = createRejection({ type: 'Denied', component: defineAsyncComponent(load) })

  if (!isRejection(rejection)) {
    throw new Error('Expected a created rejection')
  }

  const page = createRejectionPage(rejection, async () => undefined, 200)
  const controller = new AbortController()
  const update = vi.fn()
  const commit = createPageCommit({ page, signal: controller.signal, update, settle: (response) => response })
  const preparing = commit.prepare()

  controller.abort()

  await expect(preparing).resolves.toEqual({ status: 'ABANDONED' })
  await expect(commit.commit()).resolves.toBe(false)
  expect(load).toHaveBeenCalledOnce()
  expect(update).not.toHaveBeenCalled()
  component.resolve({})
})

test('canceling preparation abandons its values instead of adopting them on the next navigation', async () => {
  const data = Promise.withResolvers<string>()
  const signals: AbortSignal[] = []
  const load = vi.fn((_route, { signal }) => {
    signals.push(signal)

    return data.promise
  })
  const route = createResolvedRoute(createRoute({ name: 'route', path: '/' }).addLoader(load))
  const values = createRouteValueStore()
  const components = createComponentsStore(Symbol())
  const controller = new AbortController()
  const first = createPageCommit({
    page: createRoutePage(route, components, values),
    signal: controller.signal,
    update: vi.fn(),
    settle: (response) => response,
  })
  const preparing = first.prepare()

  controller.abort()
  await expect(preparing).resolves.toEqual({ status: 'ABANDONED' })
  expect(signals[0].aborted).toBe(true)

  const next = createPageCommit({
    page: createRoutePage(route, components, values),
    signal: new AbortController().signal,
    update: vi.fn(),
    settle: (response) => response,
  })

  await next.commit()
  expect(load).toHaveBeenCalledTimes(2)
  expect(signals[1].aborted).toBe(false)
  data.resolve('fresh')
  await expect(values.getData(route)).resolves.toBe('fresh')
})
