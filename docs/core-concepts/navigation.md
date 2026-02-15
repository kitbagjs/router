# Navigation

We'll use these example routes to demonstrate navigation:

```ts
const blog = createRoute({
  name: 'blog',
  path: '/blog',
})

const blogPost = createRoute({
  parent: blog,
  name: 'blogPost',
  path: withParams('/[blogPostId]', {
    blogPostId: Number,
  }),
})
```

## Using a link

The router link component makes it easy to create links to routes, external routes, or any url. See the [RouterLink](/components/router-link) docs for more info.

```vue
<router-link to="(resolve) => resolve('blogPost', { blogPostId: 1 })">Blog Post One</router-link>
```

## Programmatic Navigation

Using [`router.push`](/core-concepts/router#push), [`router.replace`](/core-concepts/router#replace), or [`route.update`](/core-concepts/router-route#update) you can do programmatic navigation.

::: code-group

```ts [Push]
import { useRouter } from '@kitbag/router'

const router = useRouter()

router.push('blogPost', {
  blogPostId: 1,
})
```

```ts [Replace]
import { useRouter } from '@kitbag/router'

const router = useRouter()

router.replace('blogPost', {
  blogPostId: 1,
})
```

```ts [Update]
import { useRoute } from '@kitbag/router'

const route = useRoute('blogPost')

route.update({ blogPostId: 1 })
```

:::

## Routes vs Urls

All navigation methods accept a route or a url. Using a route is the recommended because it is type safe. But sometimes it is necessary to use a url. These examples are all the same functionally.

::: code-group

```ts [Router]
// type safe ✅
router.push('blogPost', {
  blogPostId: 1,
})

// not type safe ⚠️
router.push('/blogPost/1')
```

```vue [Router Link]
<!-- type safe ✅ -->
<router-link to="(resolve) => resolve('blogPost', { blogPostId: 1 })">Blog Post One</router-link>

<!-- not type safe ⚠️ -->
<router-link to="/blogPost/1">Blog Post One</router-link>
```

:::

## Push vs Replace

A push is the default when navigating. This will add a new entry to the browser history using [pushState](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState).

A replace will also navigate to the new route, but it will replace the current entry in the browser history using [replaceState](https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState).

::: code-group

```ts [Router]
// push
router.push('blog')

// replace
router.replace('blog')

// or
router.push('blog', { replace: true })
```

```vue [RouterLink]
<!-- push -->
<router-link to="(resolve) => resolve('blog')">Blog</router-link>

<!-- replace -->
<router-link to="(resolve) => resolve('blog')" replace>Blog</router-link>
```

:::

## Resolved Routes

A [ResolvedRoute](/api/types/ResolvedRoute) is the base of what makes up the [Router Route](/core-concepts/router-route). It represents a [route](/core-concepts/routes) that has been matched to a specific url. It includes any params, state, query, and hash values for that url. Resolved routes are how Kitbag Router ensures type safety when navigating. There are a few ways to get a resolved route.

```ts
/**
 * This is the most explicit way to get a resolved route. 
 * It takes a route name and will ensure any required params are provided.
 */
const resolvedBlockPostRoute = router.resolve('blogPost', {
  blogPostId: 1,
})
```

Resolved routes add some useful properties to the route.

- `href`: The full url of the route.
- `query`: The query parameters of the route.
- `hash`: The hash of the route.
- `params`: The parameters of the route.
- `state`: The state of the route.

## Create Url

Kitbag Router also exports the `createUrl` function, which exposes all of the utility of defining a URL with params outside of a route definition.

```ts
import { createUrl, withDefault } from '@kitbag/router'

const getUser = createUrl({
  host: 'https://api.kitbag.dev',
  path: '/users/[userId]',
  query: {
    version: withDefault(Number, 1),
  },
})

const href = getUser.stringify({ userId: 'PAOP4KAW' })
// 'https://api.kitbag.dev/users/PAOP4KAW?version=1'

const params = getUser.parse('https://api.kitbag.dev/users/L969HD9Z?version=4')
// { userId: 'L969HD9Z', version: 4 }
```

The `createUrl` function returns a [Url](/api/types/Url) object.
