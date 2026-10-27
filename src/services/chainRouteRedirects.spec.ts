import { expect, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createExternalRoute } from '@/services/createExternalRoute'
import { createRouter } from '@/services/createRouter'
import { component } from '@/utilities/testHelpers'

test.each(['redirectTo', 'redirectFrom'] as const)('%s returns its receiver and registers immediately', async (method) => {
  const source = createRoute({ name: 'source', path: '/source' }).addView(component)
  const target = createRoute({ name: 'target', path: '/target' }).addView(component)

  if (method === 'redirectTo') {
    expect(source.redirectTo(target)).toBe(source)
  } else {
    expect(target.redirectFrom(source)).toBe(target)
  }

  const router = createRouter([source, target], { initialUrl: '/source' })

  try {
    await router.start()
    expect(router.route.name).toBe('target')
  } finally {
    router.stop()
  }
})

test('external redirects return the receiving route', () => {
  const parent = createExternalRoute({ host: 'https://example.com', path: '/parent' })
  const source = createExternalRoute({ parent, name: 'source', path: '/source' })
  const target = createExternalRoute({ parent, name: 'target', path: '/target' })

  expect(source.redirectTo(target)).toBe(source)
  const legacy = createRoute({ path: '/legacy' })
  expect(target.redirectFrom(legacy)).toBe(target)
})
