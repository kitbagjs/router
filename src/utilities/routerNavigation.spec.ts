import { expect, test, vi } from 'vitest'
import { createRouterNavigation } from '@/utilities/routerNavigation'
import { random } from '@/utilities/testHelpers'

test('when update is called executes hooks', async () => {
  const onBeforeLocationUpdate = vi.fn(() => Promise.resolve(true))
  const onAfterLocationUpdate = vi.fn()
  const url = random.number().toString()
  const history = createRouterNavigation({ onBeforeLocationUpdate, onAfterLocationUpdate })

  await history.update(url)

  expect(onBeforeLocationUpdate).toHaveBeenCalled()
  expect(onAfterLocationUpdate).toHaveBeenCalled()
})