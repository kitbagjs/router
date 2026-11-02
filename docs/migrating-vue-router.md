# Migrating from Vue Router

| Feature | Vue Router | Kitbag Router |
| --- | :---: | :---: |
| [Nested routes](/core-concepts/routes#parent) | ✅ | ✅ |
| [Named views](/core-concepts/routes#named-views) | ✅ | ✅ |
| [Typed routes](/core-concepts/type-safety) | ✅ | ✅ |
| [Typed params](/core-concepts/params#param-types) | [🧪 Experimental](https://router.vuejs.org/experimental/param-parsers) | ✅ |
| [Navigation guards](/advanced-concepts/hooks) | ✅ | ✅ |
| [Redirects](/advanced-concepts/redirects) and [aliases](/advanced-concepts/aliases) | ✅ | ✅ |
| [Data loaders](/core-concepts/loaders) | ✅ | ✅ |
| [Server rendering](/advanced-concepts/server-side-rendering) | ✅ | ✅ |
| [View transitions](/advanced-concepts/view-transitions) | [🟡](https://router.vuejs.org/api/interfaces/routerlinkprops#viewtransition) | ✅ |
| [Dynamic route registration](https://router.vuejs.org/guide/advanced/dynamic-routing.html) | ✅ | ❌ |
| [Scroll behavior](https://router.vuejs.org/guide/advanced/scroll-behavior.html) | ✅ | ❌ |
| [File-based routing](https://router.vuejs.org/file-based-routing/) | ✅ | ❌ |
| [Rejection views](/advanced-concepts/rejections) | ❌ | ✅ |
| [Async props](/core-concepts/component-props) | ❌ | ✅ |
| [Prefetching](/advanced-concepts/prefetching) | ❌ | ✅ |
| [Typed external routes](/core-concepts/external-routes) | ❌ | ✅ |

See the [Quick Start](/quick-start) for installation and TypeScript setup.

## Route Configuration

Define named routes with `createRoute`, then attach components with `addView`. See [Routes](/core-concepts/routes) and [Router](/core-concepts/router).

::: code-group

```ts [Vue Router]
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './HomeView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [{
    name: 'home',
    path: '/',
    component: HomeView,
  }],
})
```

```ts [Kitbag Router]
import { createRoute, createRouter } from '@kitbag/router'
import HomeView from './HomeView.vue'

const home = createRoute({
  name: 'home',
  path: '/',
})
  .addView(HomeView)

const router = createRouter([home], {
  historyMode: 'browser',
})
```

:::

## Child Routes

Use a `parent` reference instead of `children`. Kitbag joins paths literally: `/users` + `/[id]` becomes `/users/[id]`. Use [hoisting](/core-concepts/routes#hoisting) for a child with an independent URL.

::: code-group

```ts [Vue Router]
const routes = [{
  path: '/users',
  children: [{
    name: 'user',
    path: ':id',
    component: UserView,
  }],
}]
```

```ts [Kitbag Router]
const users = createRoute({ path: '/users' })

const user = createRoute({
  parent: users,
  name: 'user',
  path: '/[id]',
})
  .addView(UserView)

const routes = [user]
```

:::

## Props Binding

Bind props through `addView`. Kitbag checks them against the component and requires a getter for required props. See [Component Props](/core-concepts/component-props).

::: code-group

```ts [Vue Router]
const user = {
  name: 'user',
  path: '/users/:id',
  component: UserView,
  props: (route) => ({ userId: route.params.id }),
}
```

```ts [Kitbag Router]
const user = createRoute({
  name: 'user',
  path: '/users/[id]',
})
  .addView(UserView, {
    props: (route) => ({ userId: route.params.id }),
  })
```

:::

## Named Views

Call `addView` for each component, with a `name` for named views. See [Named Views](/core-concepts/routes#named-views).

::: code-group

```ts [Vue Router]
const home = {
  name: 'home',
  path: '/',
  components: {
    default: HomeView,
    sidebar: SidebarView,
  },
}
```

```ts [Kitbag Router]
const home = createRoute({
  name: 'home',
  path: '/',
})
  .addView(HomeView)
  .addView(SidebarView, { name: 'sidebar' })
```

:::

## Navigation

Pass the route name and params separately. See [Navigation](/core-concepts/navigation).

::: code-group

```ts [Vue Router]
router.push({
  name: 'user',
  params: { id: '123' },
})

router.replace({
  name: 'user',
  params: { id: '456' },
})
```

```ts [Kitbag Router]
router.push('user', { id: '123' })
router.replace('user', { id: '456' })
```

:::

## Links

Use the resolver callback for typed link destinations. See [RouterLink](/components/router-link).

::: code-group

```vue [Vue Router]
<RouterLink :to="{
  name: 'user',
  params: { id: '123' },
}">
  View user
</RouterLink>
```

```vue [Kitbag Router]
<RouterLink :to="(resolve) => resolve('user', { id: '123' })">
  View user
</RouterLink>
```

:::

## View Transitions

Vue Router supports view transitions through links. Kitbag also supports router and route defaults, programmatic navigation, transition types, and shared-element helpers. See [View Transitions](/advanced-concepts/view-transitions).

::: code-group

```vue [Vue Router]
<RouterLink to="/about" view-transition>
  About
</RouterLink>
```

```vue [Kitbag Router]
<RouterLink to="/about" view-transition>
  About
</RouterLink>
```

:::

## Reading the Current Route

Kitbag exposes query values through `URLSearchParams` and matched routes through `matches`. Declared query params are also available in `route.params`. See [Router Route](/core-concepts/router-route).

::: code-group

```ts [Vue Router]
import { useRoute } from 'vue-router'

const route = useRoute()

const page = route.query.page
const matches = route.matched
const hash = route.hash // '#comments'
```

```ts [Kitbag Router]
import { useRoute } from '@kitbag/router'

const route = useRoute()

const page = route.query.get('page')
const matches = route.matches
const hash = route.hash // 'comments'
```

:::

## Navigation Guards

Use context helpers to redirect or cancel navigation. The previous route is available as `context.from`. See [Hooks](/advanced-concepts/hooks).

::: code-group

```ts [Vue Router]
const account = {
  name: 'account',
  path: '/account',
  component: AccountView,
  beforeEnter: () => {
    if (!isSignedIn()) {
      return '/login'
    }
  },
}
```

```ts [Kitbag Router]
const account = createRoute({
  name: 'account',
  path: '/account',
})
  .addView(AccountView)
  .onBeforeRouteEnter((to, context) => {
    if (!isSignedIn()) {
      context.replace('/login')
    }
  })
```

:::

## Typed Params

Kitbag parses and validates params using their declared types. Vue Router supports this through its [experimental param parsers](https://router.vuejs.org/experimental/param-parsers#setup), which require the experimental router and plugin setup. Both examples expose `id` as a number for `/users/42`. See [Param Types](/core-concepts/params#param-types).

::: code-group

```vue [Vue Router]
<!-- src/pages/users/[id=int].vue -->
<script setup lang="ts">
const route = useRoute('/users/[id=int]')

route.params.id // 42 (number)
</script>
```

```ts [Kitbag Router]
import { createRoute, useRoute, withParams } from '@kitbag/router'

const user = createRoute({
  name: 'user',
  path: withParams('/users/[id]', {
    id: Number,
  }),
})

// In the component, after registering the route:
const route = useRoute('user')

route.params.id // 42 (number)
```

:::

## Route Regex

Validate params with regular expressions using `withParams`. See [Param Types](/core-concepts/params#param-types).

::: code-group

```ts [Vue Router]
const archive = {
  name: 'archive',
  path: '/archive/:date(\\d{2}-\\d{2}-\\d{4})',
}
```

```ts [Kitbag Router]
import { createRoute, withParams } from '@kitbag/router'

const archive = createRoute({
  name: 'archive',
  path: withParams('/archive/[date]', {
    date: /^\d{2}-\d{2}-\d{4}$/,
  }),
})
```

:::

## Repeatable Params

Combine a [greedy param](/core-concepts/params#greedy-params) with `arrayOf` to read multiple path segments as an array. Both examples match `/one/two` with chapters `['one', 'two']`.

To also match `/`, use `[?chapters*]`. Add `withDefault` for an empty array when the param is missing. See [Default Values](/core-concepts/params#default-values).

::: code-group

```ts [Vue Router]
const chapters = {
  name: 'chapters',
  path: '/:chapters+',
}
```

```ts [Kitbag Router]
import { arrayOf, createRoute, withParams } from '@kitbag/router'

const chapters = createRoute({
  name: 'chapters',
  path: withParams('/[chapters*]', {
    chapters: arrayOf([String], { separator: '/' }),
  }),
})
```

:::

## Redirects

Use `redirectTo` for a fixed destination and a before hook for conditional redirects. See [Redirects](/advanced-concepts/redirects).

::: code-group

```ts [Vue Router]
const routes = [{
  name: 'new',
  path: '/new',
}, {
  name: 'old',
  path: '/old',
  redirect: { name: 'new' },
}]
```

```ts [Kitbag Router]
const newRoute = createRoute({
  name: 'new',
  path: '/new',
})

const oldRoute = createRoute({
  name: 'old',
  path: '/old',
})
  .redirectTo(newRoute)

const routes = [newRoute, oldRoute]
```

:::

## Aliases

Both routers keep the alias URL in the address bar. Kitbag also supports aliases with different params through a transform. See [Aliases](/advanced-concepts/aliases).

::: code-group

```ts [Vue Router]
const user = {
  name: 'user',
  path: '/users/:id',
  alias: '/members/:id',
}
```

```ts [Kitbag Router]
const user = createRoute({
  name: 'user',
  path: '/users/[id]',
})
  .addAlias({ path: '/members/[id]' })
```

:::
