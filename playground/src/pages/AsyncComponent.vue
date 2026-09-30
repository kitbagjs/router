<script setup lang="ts">
import { now } from '../sleep'

const renderedAt = now()
</script>

<template>
  <div class="page">
    <h1>Async component</h1>
    <p>This component's chunk takes a second to load. The router awaited it before starting the transition, so the new page was never captured empty.</p>
    <p class="muted">Rendered at {{ renderedAt }}</p>
  </div>
</template>
