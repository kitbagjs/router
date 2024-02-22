import { expect, test, vi } from 'vitest'
import { createRouterNavigation } from '@/utilities/routerNavigation'
import { random } from '@/utilities/testHelpers'

test('Browser like navigation is not supported', () => {
  const onAfterLocationUpdate = vi.fn()
  const navigation = createRouterNavigation({ onAfterLocationUpdate })

  expect(() => navigation.back()).toThrowError()
  expect(() => navigation.forward()).toThrowError()
  expect(() => navigation.go(1)).toThrowError()
})

test('when update is called and same origin calls onAfterLocationUpdate', () => {
  const onAfterLocationUpdate = vi.fn()
  const url = random.number().toString()
  const history = createRouterNavigation({ onAfterLocationUpdate })

  history.update(url)

  expect(onAfterLocationUpdate).toHaveBeenCalledWith(url)
})