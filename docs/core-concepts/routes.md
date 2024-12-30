# Routes
Routes are used to define the structure of your application and to provide a way to navigate between different parts of your application or to an external address. You can define routes within your application using the `createRoute` function.

```ts
import { createRoute } from '@kitbag/router'

const home = createRoute({
  name: 'home',
  path: '/',
})
```

## Name
The `name` property is used to identify the route. Name is optional but a route without a name cannot be navigated to directly. Each route mush have a unique name.

```ts {2}
const home = createRoute({
  name: 'home',
  path: '/',
})
```

## Path
The `path` property is used to define the [pathname](https://developer.mozilla.org/en-US/docs/Web/API/URL/pathname) part of the route's url.

```ts {3}
const home = createRoute({
  name: 'home',
  path: '/',
})
```

## Query
The `query` property is used to define the [search](https://developer.mozilla.org/en-US/docs/Web/API/URL/search) part of the route's url. If a query is provided, a url must include a search string that matches the query.

```ts {4}
const homeAddCampaign = createRoute({
  name: 'home.black-friday',
  path: '/',
  query: 'campaign=black-friday',
})
```

## Hash
The `hash` property is used to define the [hash](https://developer.mozilla.org/en-US/docs/Web/API/URL/hash) part of the route's url. If a hash is provided, a url's hash must match exactly.

```ts {4}
const contact = createRoute({
  name: 'home.contact',
  path: '/',
  hash: 'contact',
})
```

## Parent
The `parent` property is used to create nested routes. In this example, `blogPost` route's path is combined with the `blog` route's path to form the full url. A route inherits many of its parent's properties. Specifically, `path`, `query`, `meta`, `state`, and `hash` are all combined.

```ts {7}
const blog = createRoute({
  name: 'blog',
  path: '/blog',
})

const blogPost = createRoute({
  parent: blog,
  name: 'blogPost',
  path: '/:postId',
})
```

## Component
The `component` property is used to define the component that will be rendered when the route is active. Component is optional and a [RouterView](/components/router-view) will be rendered if no component is provided.

```ts {6}
import HomeView from './components/HomeView.svelte'

const home = createRoute({
  name: 'home',
  path: '/',
  component: HomeView,
})
```

## Components
The `components` property is used to define multiple components for named views. This is used instead of the `component` property.

```ts {7-10}
import HomeView from './components/HomeView.vue'
import HomeSidebar from './components/HomeSidebar.vue'

const home = createRoute({
  name: 'home',
  path: '/',
  components: {
    default: HomeView,
    sidebar: HomeSidebar,
  },
})
```

## Props
The `props` property is used to define props for route components. It must be a callback function that returns an object. Everything returned from the callback will be bound to the component.

```ts {7-9}
import HomeView from './components/HomeView.vue'

const home = createRoute({
  name: 'home',
  path: '/',
  component: HomeView,
  props: () => ({
    userId: 1,
  }),
})
```

### Arguments
The props callback receives two arguments:

| Argument | Description |
| -------- | ----------- |
| params | An object containing the values of any params from the route. See [Params](/core-concepts/params) for more details. |
| context | An object containing helper methods for navigation (`push`, `replace`, `reject`). See [PropsCallbackContext](/api/types/PropsCallbackContext) for more details. |

### Return Type
The props callback must return an object or a promise that resolves to an object. The object must satisfy the props for the component.

## Meta
The `meta` property is used to define metadata for the route. Meta is optional and can be used to define static metadata for the route to reference in the [router route](/core-concepts/router-route) or in [hooks](/advance-concepts/hooks)

```ts {7-9}
import HomeView from './components/HomeView.vue'

const home = createRoute({
  name: 'home',
  path: '/',
  component: HomeView,
  meta: {
    title: 'Home',
  },
})
```

## State
The `state` property is used to define optional data that can stored on the route in the browser's history. State is always optional, but it can be used to pass data to the route when navigating or to preserve state when navigating away from the route.

```ts {7-11}
import HomeView from './components/HomeView.vue'

const home = createRoute({
  name: 'home',
  path: '/',
  component: HomeView,
  state: {
    userId: Number
  },
})
```

## Hooks
Hooks can be defined on a individual route. Each hook can be a function or an array of functions. See [Hooks](/advanced-concepts/hooks) for more information about hooks.

```ts {7-9}
import HomeView from './components/HomeView.vue'

const home = createRoute({
  name: 'home',
  path: '/',
  component: HomeView,
  onBeforeRouteEnter: () => {
    console.log('before route enter')
  },
})
```

## Prefetching
Routes can be prefetched to improve performance. See the [Prefetching](/advanced-concepts/prefetching) documentation for more information.

```ts
const home = createRoute({
  name: 'home',
  path: '/',
  prefetch: {
    components: 'lazy',
    props: 'intent'
  },
})
```
