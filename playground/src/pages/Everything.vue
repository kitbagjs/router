<script setup lang="ts">
import { useRoute } from '../router'
import { ref } from 'vue'
import { now } from '../sleep'

defineProps<{ propsLoadedAt: string }>()

const route = useRoute('everything')
const loaderResult = ref('')
const renderedAt = now()

route.data.then((value) => {
  loaderResult.value = value
})
</script>

<template>
  <div class="page">
    <h1>Everything at once</h1>
    <p>An async component (500ms), async props (400ms) and a loader (900ms) all load concurrently. The transition waits for the slowest.</p>
    <p class="muted">Props loaded at {{ propsLoadedAt }}, {{ loaderResult || 'loader pending' }}, rendered at {{ renderedAt }}</p>
  </div>
</template>
