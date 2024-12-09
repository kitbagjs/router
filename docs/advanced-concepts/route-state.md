# Route State

It may be useful to store state for a given route to improve your user's experience. In situations like a form that a user might fill out, it might be useful to store form values in the [browser state](https://developer.mozilla.org/en-US/docs/Web/API/History/state) so that if the user navigates unexpectedly the values can be restored when going back. Kitbag Router extends this functionality by offering the same [param experience](/core-concepts/route-params#param-types) on `path`, `query`, etc on state as well.

```ts
import { createRoute, createRouter } from '@kitbag/router'

const routes = [
  createRoute({ 
    name: 'example-form',
    state: {
      email: String,
      active: Boolean,
    }
  }),
]

const router = createRouter(routes)
```

## Always Optional

State properties are always expected to be optional. The only exception to this is when your state property is defined with the `withDefault` utility.

```ts
const routes = [
  createRoute({ 
    name: 'example-form',
    state: {
      email: String,
      active: Boolean, // [!code --]
      active: withDefault(Boolean, false), // [!code ++]
    }
  }),
]
```

## Reading State

Accessing the runtime values can be found on a route's `state` property

```ts
const route = useRoute('example-form')

route.state.email
```

## Writing State

There is a `state` property on router `push` and `replace`, which can be used to set state according to the routes state params.

```ts
router.push('example-form', {}, {
  email: 'mittens@kitbag.dev',
})
```

The state values on the route are **writable**. This means that you can just modify the values directly and Kitbag Router will handle the communication with browser to update history state. You can use `route.update()` method which takes the same properties as `push()`.
