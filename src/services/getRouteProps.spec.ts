import { expect, test, vi } from 'vitest'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { createRoute } from '@/services/createRoute'
import { getRouteProps } from '@/services/getRouteProps'
import { CallbackContextResponse } from '@/types/callbackContext'
import { createRouterNavigation } from '@/services/createRouterNavigation'
import { NavigationAbandonedError } from '@/errors/navigationAbandonedError'
import { component } from '@/utilities/testHelpers'

test('pending props report abandonment when their navigation is disposed', async () => {
  const route = createResolvedRoute(createRoute({ path: '/' }).addView(component, { props: () => ({}) }))
  const pending = Promise.withResolvers<CallbackContextResponse>()
  const store = createRouterNavigation().current()
  const getState = vi.spyOn(store, 'getState').mockReturnValue({ status: 'RUNNING' })
  const subscribe = vi.spyOn(store, 'subscribe').mockReturnValue(pending.promise)
  const location = { depth: 0, name: 'default' } as const
  const props = getRouteProps(store, location, route)

  expect(subscribe).toHaveBeenCalledExactlyOnceWith({ kind: 'props', ...location }, route)
  getState.mockReturnValue({ status: 'ABANDONED' })
  pending.reject(new NavigationAbandonedError())

  await expect(props).resolves.toEqual({ kind: 'abandoned' })
})

test('pending and settled errors become props error results', async () => {
  const route = createResolvedRoute(createRoute({ path: '/' }).addView(component, { props: () => ({}) }))
  const pending = Promise.withResolvers<CallbackContextResponse>()
  const store = createRouterNavigation().current()
  const getState = vi.spyOn(store, 'getState').mockReturnValue({ status: 'RUNNING' })
  vi.spyOn(store, 'subscribe').mockReturnValue(pending.promise)
  const location = { depth: 0, name: 'default' } as const
  const props = getRouteProps(store, location, route)
  const error = new Error('props failed')
  const response = { status: 'ERROR', source: 'props', error } as const

  pending.resolve(response)
  getState.mockReturnValue(response)

  await expect(props).resolves.toEqual({ kind: 'error', error })
  expect(getRouteProps(store, location, route)).toEqual({ kind: 'error', error })
})

test.each([
  { status: 'PUSH', to: ['/next'] },
  { status: 'REJECT', type: 'NotFound' },
] satisfies CallbackContextResponse[])('a $status response becomes an abandoned props result', (response) => {
  const route = createResolvedRoute(createRoute({ path: '/' }).addView(component, { props: () => ({}) }))
  const store = createRouterNavigation().current()
  vi.spyOn(store, 'getState').mockReturnValue(response)
  const subscribe = vi.spyOn(store, 'subscribe')

  expect(getRouteProps(store, { depth: 0, name: 'default' }, route)).toEqual({ kind: 'abandoned' })
  expect(subscribe).not.toHaveBeenCalled()
})

test('a view without a props getter does not read or subscribe to a computation', () => {
  const route = createResolvedRoute(createRoute({ path: '/' }).addView(component))
  const store = createRouterNavigation().current()
  const getState = vi.spyOn(store, 'getState')
  const subscribe = vi.spyOn(store, 'subscribe')

  expect(getRouteProps(store, { depth: 0, name: 'default' }, route)).toEqual({ kind: 'value', value: undefined })
  expect(getState).not.toHaveBeenCalled()
  expect(subscribe).not.toHaveBeenCalled()
})

test('a view whose route is no longer matched does not read destination props', () => {
  const route = createResolvedRoute(createRoute({ path: '/next' }).addView(component, { props: () => ({ value: 'next' }) }))
  const store = createRouterNavigation().current()
  const getState = vi.spyOn(store, 'getState')
  const subscribe = vi.spyOn(store, 'subscribe')

  expect(getRouteProps(store, { depth: -1, name: 'default' }, route)).toEqual({ kind: 'value', value: undefined })
  expect(getState).not.toHaveBeenCalled()
  expect(subscribe).not.toHaveBeenCalled()
})
