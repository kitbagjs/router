<script setup lang="ts">
import { ref } from 'vue'
import { now } from '../sleep'

const count = ref(0)
const renderedAt = now()
</script>

<template>
  <div class="page">
    <h1>Sync component</h1>
    <p>Nothing to wait for. The transition starts on the next frame after the click.</p>
    <p class="muted">Rendered at {{ renderedAt }}</p>
    <p>
      <button @click="count++">Clicked {{ count }} times</button>
      <span class="muted"> — click this while another page is loading to see that this page stays live.</span>
    </p>
  </div>
</template>
