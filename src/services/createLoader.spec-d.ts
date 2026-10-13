import { expectTypeOf, test } from 'vitest'
import { createLoader } from '@/services/createLoader'
import { createRoute } from '@/services/createRoute'
import { createRejection } from '@/services/createRejection'
import { withParams } from '@/services/withParams'
import { WithData } from '@/types/resolved'

test('params are checked at attachment', () => {
  const loader = createLoader({ load: ({ id }: { id: string }) => id.length })
  const route = createRoute({ name: 'user', path: '/users/[id]' }).addLoader(loader)
  const other = createRoute({ name: 'post', path: '/posts/[id]/[slug]' }).addLoader(loader, { name: 'length' })

  expectTypeOf<WithData<typeof route>['data']>().toEqualTypeOf<Promise<number>>()
  expectTypeOf<WithData<typeof other>['data']>().toEqualTypeOf<{ length: Promise<number> }>()

  // @ts-expect-error the route does not provide id
  createRoute({ path: '/' }).addLoader(loader)
  // @ts-expect-error an optional id cannot satisfy a required id
  createRoute({ path: '/[?id]' }).addLoader(loader)
  // @ts-expect-error id must be a string
  createRoute({ path: withParams('/[id]', { id: Number }) }).addLoader(loader, { name: 'length' })
})

test('declared context types the loader and attached route helpers', () => {
  const login = createRoute({ name: 'login', path: '/login' })
  const denied = createRejection({ type: 'Denied' })
  const loader = createLoader({
    context: [login, denied],
    load: (_params, { push, reject }) => {
      push('login')
      reject('Denied')
      // @ts-expect-error the attached route is not known to the loader
      push('user')
      // @ts-expect-error undeclared rejection
      reject('Other')

      return true
    },
  })
  const route = createRoute({ name: 'user', path: '/' }).addLoader(loader)

  route.onBeforeRouteEnter((_to, { push, reject }) => {
    push('login')
    reject('Denied')
    // @ts-expect-error attaching a loader must not widen the route's context
    push('unrelated')
  })
})

test('async data types the transformer without widening from it', () => {
  const loader = createLoader({
    load: async () => new Date(),
    transformer: {
      stringify: (value) => {
        expectTypeOf(value).toEqualTypeOf<Date>()

        return value.toISOString()
      },
      parse: (encoded) => new Date(encoded),
    },
  })
  const route = createRoute({ path: '/' }).addLoader(loader)

  expectTypeOf<WithData<typeof route>['data']>().toEqualTypeOf<Promise<Date>>()
  createLoader({
    load: async () => new Date(),
    transformer: {
      stringify: (value) => value.toISOString(),
      // @ts-expect-error the transformer must restore the loader's resolved value
      parse: (encoded) => encoded,
    },
  })
})
