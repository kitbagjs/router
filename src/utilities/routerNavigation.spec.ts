import { expect, test, vi } from 'vitest'
import { createRouterNavigation } from '@/utilities/routerNavigation'
import { random } from '@/utilities/testHelpers'

test('Browser like navigation is not supported', () => {
  const onLocationUpdate = vi.fn()
  const navigation = createRouterNavigation({ onLocationUpdate })

  expect(() => navigation.back()).toThrowError()
  expect(() => navigation.forward()).toThrowError()
  expect(() => navigation.go(1)).toThrowError()
})

test('when update is called and same origin calls onLocationUpdate', () => {
  const onLocationUpdate = vi.fn()
  const url = random.number().toString()
  const history = createRouterNavigation({ onLocationUpdate })

  history.update(url)

  expect(onLocationUpdate).toHaveBeenCalledWith(url)
})