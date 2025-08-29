import { createRouter } from '@/services/createRouter'
import { component } from '@/utilities/testHelpers'
import { describe, test } from 'vitest'
import { InjectionKey } from 'vue'
import { createUseLink } from './useLink'
import { createRoute } from '@/services/createRoute'

describe('useLink', () => {
  test('accepts route name', () => {
    const routes = [
      createRoute({
        name: 'exists',
        path: '/exists',
        component,
      }),
    ]
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const router = createRouter(routes)
    const key: InjectionKey<typeof router> = Symbol()

    const useLink = createUseLink(key)

    useLink('exists')

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    useLink('does-not-exist')
  })

  test('accepts route name with params', () => {
    const routes = [
      createRoute({
        name: 'exists',
        path: '/exists/[param]',
        component,
      }),
    ]
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const router = createRouter(routes)
    const key: InjectionKey<typeof router> = Symbol()

    const useLink = createUseLink(key)

    // missing params
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    useLink('exists')

    // incorrect param type
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    useLink('exists', { param: 1 })

    useLink('exists', { param: 'test' })
  })

  test('accepts route name getters', () => {
    const routes = [
      createRoute({
        name: 'exists',
        path: '/exists',
        component,
      }),
    ]
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const router = createRouter(routes)
    const key: InjectionKey<typeof router> = Symbol()

    const useLink = createUseLink(key)

    useLink(() => 'exists')

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    useLink(() => 'does-not-exist')
  })

  test('accepts url', () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const router = createRouter([])
    const key: InjectionKey<typeof router> = Symbol()

    const useLink = createUseLink(key)

    useLink('/valid-url')

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    useLink('invalid-url')
  })

  test('accepts url getter', () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const router = createRouter([])
    const key: InjectionKey<typeof router> = Symbol()

    const useLink = createUseLink(key)

    useLink(() => '/valid-url' as const)

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    useLink(() => 'invalid-url' as const)
  })

  test('accepts resolved route', () => {
    const routes = [
      createRoute({
        name: 'exists',
        path: '/exists',
        component,
      }),
    ]

    const router = createRouter(routes)
    const route = router.resolve('exists')
    const key: InjectionKey<typeof router> = Symbol()

    const useLink = createUseLink(key)

    useLink(route)

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    useLink({})
  })
})
