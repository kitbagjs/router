import { createLoader, type Loader } from '@kitbag/router'
import { request } from '../activity'

export const countries: Loader<Promise<string[]>> = createLoader({
  load: (_route, { signal }) => request('shipping countries', ['United States', 'Canada'], signal),
})
