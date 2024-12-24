# External Routes
You can also define external routes. External routes are just like normal routes except they must be provided a `host` and they can only have the `name`, `host`, `path`, `query`, and `hash` properties. An external route's host can be provided by a parent. When navigating to an external route, the router will simply push the url to the browser's history.

```ts
import { createExternalRoute } from '@kitbag/router'

const docs = createExternalRoute({
  name: 'docs',
  host: 'https://router.kitbag.dev',
})
```