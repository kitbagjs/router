import { expectTypeOf, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createRejection } from '@/services/createRejection'
import { withParams } from '@/services/withParams'
import { Tags } from '@/types/tags'

test('setTags receives the scoped API and destination with typed loader data and route helpers', () => {
  const login = createRoute({ name: 'login', path: '/login' })
  const denied = createRejection({ type: 'Denied' })
  const route = createRoute({
    name: 'product',
    path: withParams('/products/[id]', { id: Number }),
    context: [login, denied],
  })
    .addLoader(() => ({ title: 'Product' }))

  const result = route.setTags(async (tags, { to, signal, push, replace, reject, update, parent }) => {
    expectTypeOf(tags).toEqualTypeOf<Tags>()
    expectTypeOf(to.params.id).toEqualTypeOf<number>()
    expectTypeOf(signal).toEqualTypeOf<AbortSignal>()
    expectTypeOf(parent).toEqualTypeOf<undefined>()

    const data = await to.getData()

    tags.title.set(data.title)
    push('login')
    replace('product', { id: 1 })
    reject('Denied')
    update({ id: 2 })

    // @ts-expect-error params keep their declared types
    push('product', { id: 'wrong' })
    // @ts-expect-error helpers only include declared context routes
    push('unknown')
    // @ts-expect-error rejections must be declared in context
    reject('Unknown')
  })

  expectTypeOf(result).toEqualTypeOf<typeof route>()
})

test('setTags inherits loader data and parent context through chained route methods', () => {
  const parent = createRoute({ name: 'parent', path: '/' })
    .addLoader(() => 42, { name: 'count' })
  const child = createRoute({ parent, name: 'child', path: 'child' })
    .addLoader(() => 'Child')

  child.setTags(async (tags, { to, parent }) => {
    expectTypeOf(await to.getData()).toEqualTypeOf<string>()
    expectTypeOf(await to.getData('count')).toEqualTypeOf<number>()
    expectTypeOf(await parent.getData('count')).toEqualTypeOf<number>()
    expectTypeOf(parent.name).toEqualTypeOf<'parent'>()

    tags.title.set(await to.getData())
  })
})
