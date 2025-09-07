# useRouter

Returns the installed router instance. This composable provides access to the router for programmatic navigation and route management.

## Basic Usage

```ts
import { useRouter } from '@kitbag/router'

const router = useRouter()
```

## Navigation Methods

The router instance provides several methods for navigation:

### Push Navigation

```ts
const router = useRouter()

// Navigate to a named route
router.push('home')

// Navigate with parameters
router.push('user', { userId: 123 })

// Navigate with query and state
router.push('search', { query: 'vue' }, {
  query: { category: 'frontend' },
  state: { from: 'homepage' }
})
```

### Replace Navigation

```ts
// Replace current history entry
router.replace('login')

// Or use push with replace option
router.push('dashboard', {}, { replace: true })
```

### URL Navigation

```ts
// Navigate using URL strings (not type-safe)
router.push('/about')
router.push('https://external-site.com')
```

## Route Resolution

```ts
const router = useRouter()

// Resolve a route to get its URL
const homeUrl = router.resolve('home')
const userUrl = router.resolve('user', { userId: 123 })
```

## Common Patterns

### Conditional Navigation

```ts
const router = useRouter()

function handleLogin(user) {
  if (user.isAdmin) {
    router.push('admin-dashboard')
  } else {
    router.push('user-dashboard', { userId: user.id })
  }
}
```

### Navigation with Error Handling

```ts
const router = useRouter()

async function navigateToUser(userId) {
  try {
    await router.push('user', { userId })
  } catch (error) {
    // Handle navigation errors (e.g., route guards)
    console.error('Navigation failed:', error)
  }
}
```

:::tip Type Safety
[Register](/quick-start.html#type-safety) your router to get the proper types when using this composable. This enables autocomplete and type checking for route names and parameters.
:::

:::info Related

- [Navigation Guide](/core-concepts/navigation) - Learn more about navigation patterns
- [Router API](/api/types/Router) - Complete router type reference
- [useRoute](/composables/useRoute) - Access current route information

:::
