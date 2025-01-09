import { expectTypeOf, test } from 'vitest'
import { createRoute } from '@/main'
import echo from '@/components/echo'

test('prop type is preserved', () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const parent = createRoute({
    component: echo,
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const route = createRoute({
    path: '/[id]',
    component: echo,
    props: (route) => ({ value: 'value', hello: 'world' }),
  })

  type Matched = typeof route.matched
  type Props = Matched['props']

  type Component = Matched['component']

  type Expected = {
    value: string,
    hello: string,
  }

  expectTypeOf<ReturnType<Props>>().toEqualTypeOf<Expected>()
})
