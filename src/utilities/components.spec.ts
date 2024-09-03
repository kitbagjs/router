import { expect, test } from 'vitest'
import { defineAsyncComponent } from 'vue'
import helloWorld from '@/components/helloWorld'
import { isAsyncComponent } from '@/utilities/components'

test.each([
  [helloWorld, false],
  [defineAsyncComponent(() => import('@/components/helloWorld')), true],
])('isAsyncComponent returns correct value', (component, isAsync) => {
  expect(isAsyncComponent(component)).toBe(isAsync)
})