<script setup lang="ts">
  import { computed } from 'vue'
  import { RouterLink, RouterSuspense, RouterView, useRoute, useRouter } from '@kitbag/router'
  import { activity } from './activity'

  const route = useRoute()
  const router = useRouter()
  const loaders = computed(() => Object.keys(route.loaders))
</script>

<template>
  <header>
    <RouterLink :to="(resolve) => resolve('home')" class="brand">
      kitbag<span> / discovery</span>
    </RouterLink>
    <nav aria-label="Examples">
      <RouterLink :to="(resolve) => resolve('checkout')">
        Checkout
      </RouterLink>
      <RouterLink :to="(resolve) => resolve('profile')">
        Profile
      </RouterLink>
      <RouterLink :to="(resolve) => resolve('preferences')">
        Account
      </RouterLink>
      <RouterLink :to="(resolve) => resolve('shipping')">
        Shipping
      </RouterLink>
      <RouterLink :to="(resolve) => resolve('billing')">
        Billing
      </RouterLink>
      <RouterLink :to="(resolve) => resolve('pickup')">
        Pickup
      </RouterLink>
      <RouterLink :to="(resolve) => resolve('fallback')">
        Fallback
      </RouterLink>
    </nav>
  </header>
  <div class="workspace">
    <main>
      <RouterSuspense>
        <RouterView />
        <template #fallback>
          <p class="loading">
            Preparing your page…
          </p>
        </template>
        <template #error="{ error }">
          <p>{{ String(error) }}</p><button type="button" @click="router.refresh()">
            Try again
          </button>
        </template>
      </RouterSuspense>
    </main>
    <aside>
      <p class="eyebrow">
        Router activity
      </p>
      <h2>{{ route.name || 'Starting…' }}</h2>
      <p class="label">
        Registered loaders
      </p>
      <div class="tokens">
        <span v-for="name in loaders" :key="name" class="token">{{ name }}</span><span v-if="!loaders.length" class="muted">None for this route</span>
      </div>
      <div class="activity-heading">
        <p class="label">
          Requests
        </p><button type="button" class="quiet" @click="activity = []">
          Clear
        </button>
      </div>
      <ol class="activity">
        <li v-for="(event, index) in activity" :key="index">
          {{ event }}
        </li>
      </ol>
      <p v-if="!activity.length" class="muted">
        Hover a link or open a page to begin.
      </p>
      <button type="button" class="refresh" @click="router.refresh()">
        Refresh current route
      </button>
    </aside>
  </div>
  <footer>Ordinary definitions. Generated registration. Existing loader runtime.</footer>
</template>
