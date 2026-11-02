<script setup lang="ts">
import { useRoute } from '../router'
import { ref } from 'vue'
import { now } from '../sleep'

const route = useRoute('loader')
const items = ref<string[]>([])
const renderedAt = now()
const dataAt = ref('')

route.data.then((value) => {
  items.value = value
  dataAt.value = now()
})
</script>

<template>
  <div class="page">
    <h1>Async loader</h1>
    <p>The loader sleeps 600ms. It was awaited before the transition, so <code>route.data</code> resolves immediately once this renders.</p>
    <p class="muted">Rendered at {{ renderedAt }}, data read at {{ dataAt || '…' }}</p>
    <ul>
      <li v-for="item in items" :key="item">{{ item }}</li>
    </ul>
  </div>
</template>
