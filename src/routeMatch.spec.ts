import { describe, expect, test, vi } from 'vitest'
import {random} from './utilities'
import { combineRoute, removeLeadingAndTrailingSlashes } from './routeMatch'

describe('removeLeadingAndTrailingSlashes', () => {
  test('given empty string, returns empty string', () => {
    const input = ''

    const response = removeLeadingAndTrailingSlashes(input)

    expect(response).toBe('')
  })

  test('given string without leading or trailing slashes, returns same string', () => {
    const input = 'ABC123'
    
    const response = removeLeadingAndTrailingSlashes(input)

    expect(response).toBe(input)
  })

  test('given string with 1 or more leading slashes, returns same string without any leading slashes', () => {
    const leading = '/'.repeat(random.number({min: 1, max: 5}))
    const input = 'ABC123'
    const inputWithLeading = `${leading}${input}`

    console.log({inputWithLeading})
    
    const response = removeLeadingAndTrailingSlashes(inputWithLeading)

    expect(response).toBe(input)
  })

  test('given string with 1 or more trailing slashes, returns same string without any trailing slashes', () => {
    const trailing = '/'.repeat(random.number({min: 1, max: 5}))
    const input = 'ABC123'
    const inputWithTrailing = `${input}${trailing}`
    
    const response = removeLeadingAndTrailingSlashes(inputWithTrailing)

    expect(response).toBe(input)
  })
})

describe('combineRoute', () => {
  test('given single value, does nothing', () => {
    const input = 'ABC123'
    
    const response = combineRoute(input)

    expect(response).toBe(input)
  })

  test('given 1 or more values, combines each with a forward slash', () => {
    const numberOfValues = random.number({min: 1, max: 5})
    const input = new Array(numberOfValues).fill(null).map(() => 'ABC123')
    
    const response = combineRoute(...input)

    expect(response).toBe(input.join('/'))
  })
})