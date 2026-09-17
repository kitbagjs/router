import { expect, test } from 'vitest'
import { createServerRedirect } from '@/services/createServerRedirect'

test('captures the first redirect of a render', () => {
  const { setServerRedirect, getServerRedirect } = createServerRedirect()

  expect(getServerRedirect()).toBeUndefined()

  setServerRedirect(301, '/first')
  setServerRedirect(302, '/second')

  expect(getServerRedirect()).toStrictEqual({ kind: 'redirect', status: 301, location: '/first' })
})
