<script setup lang="ts">
import { RouterLink, RouterView, useViewTransition } from './router'
import { ref, watch } from 'vue'

const viewTransition = useViewTransition()
const enabled = ref(true)
const circle = ref(false)
const lastTypes = ref<string[]>([])
const supported = typeof document.startViewTransition === 'function'

// the transition object appears once the browser has been asked to transition, before it animates
watch(() => viewTransition.transition, async (transition) => {
  if (!transition) {
    return
  }

  lastTypes.value = [...viewTransition.types]

  if (!viewTransition.types.includes('circle') || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return
  }

  try {
    await transition.ready
  } catch {
    // A superseding navigation can skip this animation before it is ready.
    return
  }

  document.documentElement.animate(
    { clipPath: ['circle(0% at 50% 40%)', 'circle(120% at 50% 40%)'] },
    { duration: 600, easing: 'ease-in', pseudoElement: '::view-transition-new(main)' },
  )
})

function linkOptions(): boolean | string[] {
  if (!enabled.value) {
    return false
  }

  return circle.value ? ['circle'] : true
}
</script>

<template>
  <header class="header">
    <nav>
      <router-link :to="(resolve) => resolve('home')" :view-transition="linkOptions()">Sync</router-link>
      <router-link :to="(resolve) => resolve('syncProps')" :view-transition="linkOptions()">Sync props</router-link>
      <router-link :to="(resolve) => resolve('asyncProps', { id: '1' })" :view-transition="linkOptions()">Async props</router-link>
      <router-link :to="(resolve) => resolve('asyncComponent')" :view-transition="linkOptions()">Async component</router-link>
      <router-link :to="(resolve) => resolve('loader')" :view-transition="linkOptions()">Loader</router-link>
      <router-link :to="(resolve) => resolve('everything')" :view-transition="linkOptions()">Everything</router-link>
      <router-link :to="(resolve) => resolve('plain')" :view-transition="linkOptions()">Route says no</router-link>
      <router-link :to="(resolve) => resolve('gallery')" :view-transition="linkOptions()">Gallery</router-link>
      <router-link :to="(resolve) => resolve('nested')" :view-transition="linkOptions()">Nested</router-link>
    </nav>

    <div class="controls">
      <label><input v-model="enabled" type="checkbox" /> Animate header links</label>
      <label><input v-model="circle" type="checkbox" :disabled="!enabled" /> circle reveal (JS animation after transition.ready)</label>
      <span class="status" :class="{ pending: viewTransition.isTransitioning && !viewTransition.transition }">
        {{ viewTransition.isTransitioning && !viewTransition.transition ? `loading ${viewTransition.to?.name}, this page is still live` : viewTransition.isTransitioning ? 'animating' : 'idle' }}
      </span>
      <span class="types">last types: {{ lastTypes.length ? lastTypes.join(', ') : 'none' }}</span>
      <span class="support">{{ supported ? 'startViewTransition supported' : 'no startViewTransition in this browser' }}</span>
    </div>
  </header>

  <main class="main">
    <router-view />
  </main>
</template>
