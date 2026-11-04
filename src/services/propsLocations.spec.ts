import { expect, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { propsLocations } from '@/services/propsLocations'
import { component } from '@/utilities/testHelpers'

test('includes default and named props getters while skipping views without props', () => {
  const route = createRoute({ path: '/' })
    .addView(component, { props: () => ({}) })
    .addView(component, { name: 'summary', props: () => ({}) })
    .addView(component, { name: 'empty' })

  expect(propsLocations(route.matches[0], 2)).toEqual([
    { kind: 'props', depth: 2, name: 'default' },
    { kind: 'props', depth: 2, name: 'summary' },
  ])
})
