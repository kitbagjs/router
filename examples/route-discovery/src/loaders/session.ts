import { createLoader, type Loader } from '@kitbag/router'
import { request } from '../activity'

export const session: Loader<Promise<{ name: string }>> = createLoader({
  load: (_route, { signal }) => request('session', { name: 'Alex Morgan' }, signal),
})
