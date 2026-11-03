import { getDataKey } from '@/services/getDataKey'
import { expect, test, vi } from 'vitest'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { createRoute } from '@/services/createRoute'
import { getRouteProps } from '@/services/getRouteProps'
import { CallbackContextResponse } from '@/types/callbackContext'
import { NavigationData } from '@/services/createRouterNavigationStore'
import { NavigationAbandonedError } from '@/errors/navigationAbandonedError'
import { component } from '@/utilities/testHelpers'

test('pending props report abandonment when their navigation is abandoned', async () => {
  const route = createResolvedRoute(createRoute({ path: '/' }).addView(component, { props: () => ({}) }))
  const pending = Promise.withResolvers<CallbackContextResponse>()
  const getState = vi.fn<NavigationData['getState']>().mockReturnValue({ status: 'RUNNING' })
  const subscribe = vi.fn<NavigationData['subscribe']>().mockReturnValue(pending.promise)
  const location = { kind: 'props', id: route.id, name: 'default' } as const
  const props = getRouteProps({ getState, subscribe }, location, route)

  expect(subscribe).toHaveBeenCalledExactlyOnceWith(getDataKey(location.kind, location.id, location.name, route))
  getState.mockReturnValue({ status: 'ABANDONED' })
  pending.reject(new NavigationAbandonedError())

  await expect(props).resolves.toEqual({ kind: 'abandoned' })
})

test('pending and settled errors become props error results', async () => {
  const route = createResolvedRoute(createRoute({ path: '/' }).addView(component, { props: () => ({}) }))
  const pending = Promise.withResolvers<CallbackContextResponse>()
  const getState = vi.fn<NavigationData['getState']>().mockReturnValue({ status: 'RUNNING' })
  const subscribe = vi.fn<NavigationData['subscribe']>().mockReturnValue(pending.promise)
  const location = { kind: 'props', id: route.id, name: 'default' } as const
  const props = getRouteProps({ getState, subscribe }, location, route)
  const error = new Error('props failed')
  const response = { status: 'ERROR', source: 'props', error } as const

  pending.resolve(response)
  getState.mockReturnValue(response)

  await expect(props).resolves.toEqual({ kind: 'error', error })
  expect(getRouteProps({ getState, subscribe }, location, route)).toEqual({ kind: 'error', error })
})

test.each([
  { status: 'PUSH', to: ['/next'] },
  { status: 'REJECT', type: 'NotFound' },
] satisfies CallbackContextResponse[])('a $status response becomes an abandoned props result', (response) => {
  const route = createResolvedRoute(createRoute({ path: '/' }).addView(component, { props: () => ({}) }))
  const getState = vi.fn<NavigationData['getState']>().mockReturnValue(response)
  const subscribe = vi.fn<NavigationData['subscribe']>()

  expect(getRouteProps({ getState, subscribe }, { kind: 'props', id: route.id, name: 'default' }, route)).toEqual({ kind: 'abandoned' })
  expect(subscribe).not.toHaveBeenCalled()
})

test('a view without a props getter does not read or subscribe to a computation', () => {
  const route = createResolvedRoute(createRoute({ path: '/' }).addView(component))
  const getState = vi.fn<NavigationData['getState']>()
  const subscribe = vi.fn<NavigationData['subscribe']>()

  expect(getRouteProps({ getState, subscribe }, { kind: 'props', id: route.id, name: 'default' }, route)).toEqual({ kind: 'value', value: undefined })
  expect(getState).not.toHaveBeenCalled()
  expect(subscribe).not.toHaveBeenCalled()
})
