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
<!-- BlogNavigation.vue -->
<template>
  <nav class="blog-navigation">
    <router-link 
      :to="(resolve) => resolve('blog')"
      class="nav-link"
    >
      All Posts
    </router-link>
    
    <router-link 
      :to="(resolve) => resolve('blogPost', { blogPostId: 1 })"
      class="nav-link"
    >
      Featured Post
    </router-link>
  </nav>
</template>

<style>
.blog-navigation {
  display: flex;
  gap: 1rem;
}

.nav-link {
  padding: 0.5rem 1rem;
  text-decoration: none;
  color: #333;
}

.nav-link:hover {
  background-color: #f0f0f0;
}
</style>
```

## Programmatic Navigation

Using [`router.push`](/core-concepts/router#push), [`router.replace`](/core-concepts/router#replace), or [`route.update`](/core-concepts/router-route#update) you can do programmatic navigation.

::: code-group

```vue [Push Example]
<!-- BlogPost.vue -->
<template>
  <article>
    <h1>{{ post.title }}</h1>
    <p>{{ post.content }}</p>
    
    <div class="navigation">
      <button @click="goToNextPost" :disabled="!hasNextPost">
        Next Post
      </button>
      <button @click="goToBlog">
        Back to Blog
      </button>
    </div>
  </article>
</template>

<script setup>
import { useRouter } from '@kitbag/router'

const router = useRouter()
const props = defineProps<{ blogPostId: number }>()

function goToNextPost() {
  router.push('blogPost', {
    blogPostId: props.blogPostId + 1,
  })
}

function goToBlog() {
  router.push('blog')
}
</script>
```

```vue [Replace Example]
<!-- LoginForm.vue -->
<template>
  <form @submit.prevent="handleLogin">
    <input v-model="credentials.username" placeholder="Username" />
    <input v-model="credentials.password" type="password" placeholder="Password" />
    <button type="submit" :disabled="isLoading">Login</button>
  </form>
</template>

<script setup>
import { useRouter } from '@kitbag/router'

const router = useRouter()
const credentials = reactive({ username: '', password: '' })
const isLoading = ref(false)

async function handleLogin() {
  isLoading.value = true
  try {
    await login(credentials)
    // Replace history so user can't go back to login
    router.replace('dashboard')
  } catch (error) {
    console.error('Login failed:', error)
  } finally {
    isLoading.value = false
  }
}
</script>
```

```vue [Update Example]
<!-- BlogPost.vue -->
<template>
  <article>
    <h1>{{ route.params.blogPostId }}</h1>
    <select @change="updatePost" v-model="selectedPostId">
      <option v-for="post in posts" :key="post.id" :value="post.id">
        {{ post.title }}
      </option>
    </select>
  </article>
</template>

<script setup>
import { useRoute } from '@kitbag/router'

const route = useRoute('blogPost')
const selectedPostId = ref(route.params.blogPostId)

function updatePost() {
  // Update current route with new params
  route.update({ blogPostId: selectedPostId.value })
}
</script>
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
<!-- SearchPage.vue -->
<template>
  <div>
    <!-- type safe ✅ -->
    <router-link 
      :to="(resolve) => resolve('blogPost', { blogPostId: 1 })"
      class="post-link"
    >
      Featured Post
    </router-link>

    <!-- not type safe ⚠️ -->
    <router-link to="/blogPost/1" class="post-link">
      Direct URL Link
    </router-link>
  </div>
</template>

<style>
.post-link {
  display: block;
  padding: 1rem;
  border: 1px solid #ddd;
  margin: 0.5rem 0;
  text-decoration: none;
}
</style>
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

A [ResolvedRoute](/api/types/ResolvedRoute) is the base of what makes up the [Router Route](/core-concepts/router-route). It represents a [route](/core-concepts/routes) that has been matched to a specific location. It includes any params, state, query, and hash values for that location. Resolved routes are how Kitbag Router ensures type safety when navigating. There are a few ways to get a resolved route.

::: code-group

```ts [Router]
/**
 * This is the most explicit way to get a resolved route. 
 * It takes a route name and will ensure any required params are provided.
 */
const resolvedBlockPostRoute = router.resolve('blogPost', {
  blogPostId: 1,
})
```

```ts [Router Push]
/**
 * Router push accepts the same arguments as router.resolve and creates a resolved route internally.
 */
router.push('blogPost', {
  blogPostId: 1,
})

// or
router.push(resolvedBlockPostRoute)
```

```vue [Router Link]
<!-- Router Link accepts callback that returns a resolved route. The router's resolved method is passed automatically for ease of use. -->
<router-link to="(resolve) => resolve('blogPost', { blogPostId: 1 })">Blog Post</router-link>

<!-- or -->
<router-link :to="resolvedBlockPostRoute">Blog Post</router-link>
```

:::
