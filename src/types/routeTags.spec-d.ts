import { expectTypeOf, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { withParams } from '@/services/withParams'
import { Tags } from '@/types/tags'

test('setTags receives the scoped API, destination loader data, and cancellation context', () => {
  const route = createRoute({
    name: 'product',
    path: withParams('/products/[id]', { id: Number }),
  })
    .addLoader(() => ({ title: 'Product' }))

  const result = route.setTags(async (tags, context) => {
    const { to, signal, parent } = context

    expectTypeOf<keyof typeof context>().toEqualTypeOf<'to' | 'signal' | 'parent'>()
    expectTypeOf(tags).toEqualTypeOf<Tags>()
    expectTypeOf(to.params.id).toEqualTypeOf<number>()
    expectTypeOf(signal).toEqualTypeOf<AbortSignal>()
    expectTypeOf(parent).toEqualTypeOf<undefined>()

    const data = await to.getData()

    tags.title.set(data.title)
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

    const inherited = await parent.getTags()
    tags.title.set(`${inherited.title} - ${await to.getData()}`)

    // @ts-expect-error parent snapshots are readonly
    inherited.title = 'Changed'
  })
})
