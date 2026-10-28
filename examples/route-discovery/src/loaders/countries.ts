import { createLoader, type Loader } from '@kitbag/router'
import { request } from '../activity'

type Country = {
  code: string,
  name: string,
}

export const countries: Loader<Promise<Country[]>> = createLoader({
  load: (_route, { signal }) => request('countries', [
    {
      code: 'US',
      name: 'United States',
    },
    {
      code: 'CA',
      name: 'Canada',
    },
    {
      code: 'GB',
      name: 'United Kingdom',
    },
  ], signal),
  prefetch: 'intent',
})
