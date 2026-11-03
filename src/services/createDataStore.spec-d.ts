import { expectTypeOf, test } from 'vitest'
import { createDataStore, DataEntry } from './createDataStore'

test('entries expose all states but only settled callback results can be restored', () => {
  const store = createDataStore({ signal: new AbortController().signal })

  expectTypeOf(store.getEntries()).toEqualTypeOf<DataEntry[]>()
  store.setEntries([{ key: 'value', value: { status: 'SUCCESS', value: undefined } }])
  store.setEntries([{ key: 'error', value: { status: 'ERROR', source: 'loader', error: new Error('failed') } }])

  // @ts-expect-error unfinished computations cannot be restored as completed results
  store.setEntries([{ key: 'pending', value: { status: 'RUNNING' } }])
})
