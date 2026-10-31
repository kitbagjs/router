import { expectTypeOf, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createLoader } from '@/services/createLoader'
import { RouteWithMethods } from '@/types/routeWithMethods'
import { Loader } from '@/types/loader'

test('the default name cannot be registered twice with implicit or explicit names', () => {
  const route = createRoute({ path: '/' }).addLoader(() => 'first')

  // @ts-expect-error a second unnamed loader would reuse default
  route.addLoader(() => 1)
  // @ts-expect-error omitting options would reuse default
  route.addLoader(() => 1, undefined)
  // @ts-expect-error options without a name would reuse default
  route.addLoader(() => 1, { prefetch: false })
  // @ts-expect-error an undefined name also selects default
  route.addLoader(() => 1, { name: undefined })
  // @ts-expect-error explicit default also conflicts
  route.addLoader(() => 1, { name: 'default' })
  // @ts-expect-error reusable loaders default to the same name
  route.addLoader(createLoader({ load: () => 1 }))

  const explicit = createRoute({ path: '/' }).addLoader(() => 'first', { name: 'default' })
  // @ts-expect-error an explicitly declared default prevents another unnamed loader
  explicit.addLoader(() => 1)

  const named = route.addLoader(() => 42, { name: 'count' })
  expectTypeOf<typeof named['matches'][0]['loaders']>().toEqualTypeOf<{
    default: Loader<string>,
    count: Loader<number>,
  }>()
})

test('a named loader leaves default available but cannot reuse its own name', () => {
  const route = createRoute({ path: '/' }).addLoader(() => 'user', { name: 'user' })
  // @ts-expect-error existing named loaders cannot be registered again
  route.addLoader(() => 1, { name: 'user' })
  route.addLoader(() => 1)
  route.addLoader(() => 1, { name: 'default' })
  route.addLoader(() => 1, { name: undefined })
  route.addLoader(() => 1, { prefetch: false })
})

test('all ancestors contribute their loader names', () => {
  const grandparent = createRoute({ path: '/grandparent' })
    .addLoader(() => 'default')
    .addLoader(() => 'user', { name: 'user' })
  const parent = createRoute({ parent: grandparent, path: '/parent' })
    .addLoader(() => 'posts', { name: 'posts' })
  const child = createRoute({ parent, path: '/child' })

  // @ts-expect-error grandparent default is already declared
  child.addLoader(() => 1)
  // @ts-expect-error explicit grandparent default is already declared
  child.addLoader(() => 1, { name: 'default' })
  // @ts-expect-error grandparent named loader is already declared
  child.addLoader(() => 1, { name: 'user' })
  // @ts-expect-error parent named loader is already declared
  child.addLoader(() => 1, { name: 'posts' })
  // @ts-expect-error reusable loaders cannot reuse ancestor names
  child.addLoader(createLoader({ load: () => 1 }), { name: 'posts' })

  child.addLoader(() => 1, { name: 'comments' })
  createRoute({ parent: grandparent, path: '/sibling' }).addLoader(() => 1, { name: 'posts' })
})

test('literal unions cannot include an already declared name', () => {
  const route = createRoute({ path: '/' }).addLoader(() => 'user', { name: 'user' })
  const add = (name: 'user' | 'count'): void => {
    // @ts-expect-error the name could duplicate user
    route.addLoader(() => 1, { name })
  }
  expectTypeOf(add).toBeFunction()
})

test('dynamic names and routes with widened loader definitions remain usable', () => {
  const route = createRoute({ path: '/' }).addLoader(() => 'first')
  const add = (name: string): void => {
    route.addLoader(() => 1, { name })
  }
  const generic = (route: RouteWithMethods): void => {
    route.addLoader(() => 1)
    route.addLoader(() => 1, { name: 'named' })
  }
  expectTypeOf(add).toBeFunction()
  expectTypeOf(generic).toBeFunction()
})
