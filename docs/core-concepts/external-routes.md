# External Routes
External routes allow you to define routes for things outside of your application. External routes have all the same functionality of normal routes, including [params](/core-concepts/params). When navigating to an external route, the router will simply push the url to the browsers history. 

When defining an external route a `host` must be provided, or it can be inherited from a `parent`.

```ts
import { createExternalRoute } from '@kitbag/router'

const docs = createExternalRoute({
  name: 'docs',
  host: 'https://router.kitbag.dev',
})
```