import { createRoute } from './createRoute'
import { createResolvedRoute } from './createResolvedRoute'
import { getComputations } from './getComputations'
import { createRouterNavigation } from './createRouterNavigation'
import { expect, test } from 'vitest'
import { decodePayloadValues, encodePayloadValues, isRouterPayload } from '@/services/payload'

test('a payload is one of the two kinds the server renders', () => {
  expect(isRouterPayload({ kind: 'reject', url: '/', rejection: 'NotFound' })).toBe(true)
  expect(isRouterPayload({ kind: 'success', url: '/', values: [] })).toBe(true)
  expect(isRouterPayload({ kind: 'reject', url: '/', rejection: 404 })).toBe(false)
  expect(isRouterPayload({ kind: 'success', url: '/' })).toBe(false)
  expect(isRouterPayload({ url: '/', values: [] })).toBe(false)
})

test('encoding selects successful entries and decoding uses the client computation keys', async () => {
  const server = createResolvedRoute(createRoute({ path: '/' }).addLoader(() => 'loaded')
    .addLoader(() => new Promise(() => {}), { name: 'pending' }))
  const store = createRouterNavigation().get(server)
  store.compute(server, getComputations(server))
  const { values, failures } = encodePayloadValues(server, store.getEntries())

  expect(values).toEqual([{ kind: 'loader', depth: 0, name: 'default', encoded: '"loaded"' }])
  expect(failures).toEqual([])

  const client = createResolvedRoute(createRoute({ path: '/' }).addLoader(() => 'client'))
  const [computation] = getComputations(client)
  const decoded = decodePayloadValues(client, values)

  expect(client.id).not.toBe(server.id)
  expect(decoded).toEqual([{ key: computation.key, value: { status: 'SUCCESS', value: 'loaded' } }])
  store.abandon()
})
