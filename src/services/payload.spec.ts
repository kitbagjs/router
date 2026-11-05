import { createRoute } from './createRoute'
import { createResolvedRoute } from './createResolvedRoute'
import { getComputations } from './getComputations'
import { createRouterNavigation } from './createRouterNavigation'
import { expect, test, vi } from 'vitest'
import { decodePayloadValues, encodePayloadValues, isRouterPayload } from '@/services/payload'
import { getDataKey } from '@/services/getDataKey'

test('a payload is one of the two kinds the server renders', () => {
  expect(isRouterPayload({ kind: 'reject', url: '/', rejection: 'NotFound', values: [] })).toBe(true)
  expect(isRouterPayload({ kind: 'success', url: '/', values: [] })).toBe(true)
  expect(isRouterPayload({ kind: 'reject', url: '/', rejection: 404, values: [] })).toBe(false)
  expect(isRouterPayload({ kind: 'success', url: '/' })).toBe(false)
  expect(isRouterPayload({ url: '/', values: [] })).toBe(false)
})

test('encoding and decoding preserve the same key across server and client', async () => {
  const server = createResolvedRoute(createRoute({ path: '/' }).addLoader(() => 'loaded')
    .addLoader(() => new Promise(() => {}), { name: 'pending' })
    .addLoader(() => {
      throw new Error('failed')
    }, { name: 'failed' }))
  const store = createRouterNavigation().create()
  store.compute(server, getComputations(server))
  const { values, failures } = encodePayloadValues(server, store.getEntries())

  const [serverComputation] = getComputations(server)
  expect(values).toEqual([{ key: serverComputation.key, encoded: '"loaded"' }])
  expect(failures).toEqual([])

  const client = createResolvedRoute(createRoute({ path: '/' }).addLoader(() => 'client'))
  const [computation] = getComputations(client)
  const decoded = decodePayloadValues(client, values)

  expect(client.id).not.toBe(server.id)
  expect(computation.key).toBe(serverComputation.key)
  expect(decoded).toEqual([{ key: computation.key, value: 'loaded' }])
  store.abandon()
})

test('decodes matching server values with client transformers and full client keys', () => {
  const parse = vi.fn((encoded: string) => new Map<string, number>(JSON.parse(encoded)))
  const parent = createRoute({ path: '/', state: { page: Number } }).addLoader(() => 'parent', { name: 'parent' })
  const route = createRoute({ parent, name: 'page', path: 'page' })
    .addLoader(() => new Map<string, number>(), {
      transformer: {
        stringify: (value) => JSON.stringify(Array.from(value.entries())),
        parse,
      },
    })
  const server = createResolvedRoute(route)
  const client = createResolvedRoute(route, {}, { hash: 'details', state: { page: 2 } })
  const [serverParent, serverChild] = getComputations(server)
  const [clientParent, clientChild] = getComputations(client)
  const unrelatedKey = getDataKey({ route: server, depth: 1, kind: 'loader', name: 'other' })

  const decoded = decodePayloadValues(client, [
    { key: serverChild.key, encoded: '[["a",1]]' },
    { key: unrelatedKey, encoded: 'ignored' },
    { key: serverParent.key, encoded: '"from server"' },
  ])

  expect(clientParent.key).not.toBe(serverParent.key)
  expect(clientChild.key).not.toBe(serverChild.key)
  expect(decoded).toEqual([
    { key: clientParent.key, value: 'from server' },
    { key: clientChild.key, value: new Map([['a', 1]]) },
  ])
  expect(parse).toHaveBeenCalledExactlyOnceWith('[["a",1]]')
})
