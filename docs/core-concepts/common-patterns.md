# Common Patterns

This guide covers frequently used patterns and recipes for building applications with Kitbag Router.

## Authentication & Route Guards

### Protecting Routes with Hooks

```ts
// router.ts
import { createRouter } from '@kitbag/router'
import { useAuth } from './composables/useAuth'

const router = createRouter(routes)

// Global authentication check
router.onBeforeRouteEnter(async (to, { reject, from }) => {
  const { isAuthenticated, user } = useAuth()
  
  // Check if route requires authentication
  if (to.meta?.requiresAuth && !isAuthenticated.value) {
    reject('unauthorized', { 
      message: 'Please log in to access this page',
      redirectTo: from 
    })
    return
  }
  
  // Check role-based access
  if (to.meta?.requiredRole && user.value?.role !== to.meta.requiredRole) {
    reject('forbidden', { message: 'Insufficient permissions' })
  }
})
```

### Route Definitions with Auth Meta

```ts
// routes.ts
import { createRoute } from '@kitbag/router'

export const routes = [
  createRoute({
    name: 'dashboard',
    path: '/dashboard',
    component: () => import('./pages/Dashboard.vue'),
    meta: {
      requiresAuth: true,
      requiredRole: 'user'
    }
  }),
  
  createRoute({
    name: 'admin',
    path: '/admin',
    component: () => import('./pages/Admin.vue'),
    meta: {
      requiresAuth: true,
      requiredRole: 'admin'
    }
  })
] as const
```

## Data Loading Patterns

### Route-Level Data Loading

```ts
// routes.ts
const userRoute = createRoute({
  name: 'user',
  path: withParams('/user/[userId]', {
    userId: Number
  }),
  component: UserProfile,
}, async ({ userId }, { reject }) => {
  try {
    const user = await fetchUser(userId)
    const posts = await fetchUserPosts(userId)
    
    return {
      user,
      posts,
      isLoading: false
    }
  } catch (error) {
    reject('notFound', { message: 'User not found' })
  }
})
```

### Component-Level Loading States

```vue
<!-- UserProfile.vue -->
<template>
  <div>
    <div v-if="isLoading" class="loading">
      Loading user profile...
    </div>
    
    <div v-else-if="error" class="error">
      {{ error.message }}
    </div>
    
    <div v-else class="user-profile">
      <h1>{{ user.name }}</h1>
      <div class="posts">
        <article v-for="post in posts" :key="post.id">
          <h2>{{ post.title }}</h2>
        </article>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps<{
  user?: User
  posts?: Post[]
  isLoading?: boolean
  error?: Error
}>()
</script>
```

## Form Handling & Validation

### Form with Route State Preservation

```vue
<!-- ContactForm.vue -->
<template>
  <form @submit.prevent="handleSubmit">
    <input 
      v-model="form.name" 
      placeholder="Name" 
      required 
    />
    <input 
      v-model="form.email" 
      type="email" 
      placeholder="Email" 
      required 
    />
    <textarea 
      v-model="form.message" 
      placeholder="Message" 
      required
    />
    
    <button type="submit" :disabled="isSubmitting">
      {{ isSubmitting ? 'Sending...' : 'Send Message' }}
    </button>
  </form>
</template>

<script setup>
import { useRouter, useRoute } from '@kitbag/router'

const router = useRouter()
const route = useRoute('contact')

// Initialize form with route state or defaults
const form = reactive({
  name: route.state?.draftName || '',
  email: route.state?.draftEmail || '',
  message: route.state?.draftMessage || ''
})

const isSubmitting = ref(false)

// Save draft to route state on input
watchEffect(() => {
  router.replace('contact', {}, {
    state: {
      draftName: form.name,
      draftEmail: form.email,
      draftMessage: form.message
    }
  })
})

async function handleSubmit() {
  isSubmitting.value = true
  try {
    await submitContactForm(form)
    router.push('contact-success')
  } catch (error) {
    console.error('Submission failed:', error)
  } finally {
    isSubmitting.value = false
  }
}
</script>
```

## Search & Filtering

### Search with URL Sync

```vue
<!-- ProductSearch.vue -->
<template>
  <div class="search-page">
    <div class="search-controls">
      <input 
        v-model="searchQuery"
        placeholder="Search products..."
        @input="updateSearch"
      />
      
      <select v-model="selectedCategory" @change="updateSearch">
        <option value="">All Categories</option>
        <option v-for="cat in categories" :key="cat" :value="cat">
          {{ cat }}
        </option>
      </select>
    </div>
    
    <div class="results">
      <div v-if="isLoading">Searching...</div>
      <div v-else-if="products.length === 0">No products found</div>
      <div v-else>
        <product-card 
          v-for="product in products" 
          :key="product.id" 
          :product="product" 
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from '@kitbag/router'
import { debounce } from 'lodash-es'

const route = useRoute('search')
const router = useRouter()

// Initialize from URL params
const searchQuery = ref(route.query?.q || '')
const selectedCategory = ref(route.query?.category || '')

const products = ref([])
const isLoading = ref(false)

// Debounced search update
const updateSearch = debounce(() => {
  router.replace('search', {}, {
    query: {
      q: searchQuery.value || undefined,
      category: selectedCategory.value || undefined
    }
  })
}, 300)

// Watch route changes and perform search
watchEffect(async () => {
  if (route.query?.q || route.query?.category) {
    isLoading.value = true
    try {
      products.value = await searchProducts({
        query: route.query.q,
        category: route.query.category
      })
    } finally {
      isLoading.value = false
    }
  }
})
</script>
```

## Modal & Dialog Patterns

### Modal with Route Integration

```vue
<!-- ProductModal.vue -->
<template>
  <teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <button class="close-btn" @click="closeModal">&times;</button>
        
        <div v-if="product">
          <h2>{{ product.name }}</h2>
          <img :src="product.image" :alt="product.name" />
          <p>{{ product.description }}</p>
          <div class="price">${{ product.price }}</div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { useRoute, useRouter } from '@kitbag/router'

const route = useRoute('productModal')
const router = useRouter()

const isOpen = computed(() => route.params.productId !== undefined)
const product = ref(null)

// Load product when modal opens
watchEffect(async () => {
  if (route.params.productId) {
    product.value = await fetchProduct(route.params.productId)
  }
})

function closeModal() {
  // Navigate back to parent route
  router.push('products')
}

// Close modal on escape key
onMounted(() => {
  const handleEscape = (e) => {
    if (e.key === 'Escape' && isOpen.value) {
      closeModal()
    }
  }
  
  document.addEventListener('keydown', handleEscape)
  
  onUnmounted(() => {
    document.removeEventListener('keydown', handleEscape)
  })
})
</script>
```

## Pagination & Infinite Scroll

### Paginated Content

```vue
<!-- BlogPagination.vue -->
<template>
  <div class="blog-page">
    <div class="posts">
      <article v-for="post in posts" :key="post.id" class="post">
        <h2>{{ post.title }}</h2>
        <p>{{ post.excerpt }}</p>
        <router-link 
          :to="(resolve) => resolve('blogPost', { blogPostId: post.id })"
        >
          Read More
        </router-link>
      </article>
    </div>
    
    <nav class="pagination">
      <router-link 
        v-if="currentPage > 1"
        :to="(resolve) => resolve('blog', {}, { 
          query: { page: currentPage - 1 } 
        })"
        class="prev-btn"
      >
        Previous
      </router-link>
      
      <span class="page-info">
        Page {{ currentPage }} of {{ totalPages }}
      </span>
      
      <router-link 
        v-if="currentPage < totalPages"
        :to="(resolve) => resolve('blog', {}, { 
          query: { page: currentPage + 1 } 
        })"
        class="next-btn"
      >
        Next
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { useRoute } from '@kitbag/router'

const route = useRoute('blog')

const currentPage = computed(() => {
  return parseInt(route.query?.page) || 1
})

const posts = ref([])
const totalPages = ref(0)

// Load posts when page changes
watchEffect(async () => {
  const { posts: pagesPosts, total } = await fetchPosts({
    page: currentPage.value,
    limit: 10
  })
  
  posts.value = pagesPosts
  totalPages.value = Math.ceil(total / 10)
})
</script>
```

## Error Boundaries & 404 Handling

### Custom Error Pages

```ts
// router.ts
import { createRouter } from '@kitbag/router'

const router = createRouter(routes, {
  // Configure rejection handling
  onNotFound: () => {
    // Custom 404 handling
    return {
      name: '404',
      component: () => import('./pages/NotFound.vue')
    }
  }
})

// Global error handling
router.onBeforeRouteEnter((to, { reject }) => {
  // Custom validation logic
  if (to.name === 'admin' && !hasAdminAccess()) {
    reject('forbidden')
  }
})
```

These patterns provide a solid foundation for building robust Vue applications with Kitbag Router. Each pattern can be adapted to your specific use case and combined with others as needed.