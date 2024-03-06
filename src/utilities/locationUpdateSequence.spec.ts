import { expect, test, vi } from 'vitest'
import { NavigationAbortError } from '@/errors/navigationAbortError'
import { executeLocationUpdateSequence } from '@/utilities/locationUpdateSequence'

test.each([
  [true],
  [false],
])('if onBeforeLocationUpdate returns false, does not execute onAfterLocationUpdate', async (beforeReturnValue) => {
  const onBeforeLocationUpdate = vi.fn().mockResolvedValue(beforeReturnValue)
  const updateLocation = vi.fn()
  const onAfterLocationUpdate = vi.fn()

  await executeLocationUpdateSequence({
    onBeforeLocationUpdate,
    updateLocation,
    onAfterLocationUpdate,
  })

  expect(onBeforeLocationUpdate).toHaveBeenCalledOnce()
  expect(updateLocation).toHaveBeenCalledOnce()
  expect(onAfterLocationUpdate).toHaveBeenCalledTimes(beforeReturnValue ? 1 : 0)
})

test('if onBeforeLocationUpdate throws NavigationAbortError, gracefully exits', async () => {
  const onBeforeLocationUpdate = vi.fn().mockImplementation(() => {
    throw new NavigationAbortError()
  })
  const updateLocation = vi.fn()
  const onAfterLocationUpdate = vi.fn()

  await executeLocationUpdateSequence({
    onBeforeLocationUpdate,
    updateLocation,
    onAfterLocationUpdate,
  })

  expect(onBeforeLocationUpdate).toHaveBeenCalledOnce()
  expect(updateLocation).not.toHaveBeenCalledOnce()
  expect(onAfterLocationUpdate).not.toHaveBeenCalledOnce()
})