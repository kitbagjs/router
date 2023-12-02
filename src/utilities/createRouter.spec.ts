import { describe, test } from 'vitest'
import { createRouter } from '@/utilities/createRouter'

describe('createRouter', () => {
  test('test', () => {
    const router = createRouter([
      {
        name: 'accounts',
        path: '/accounts',
      },
    ])
  })
})