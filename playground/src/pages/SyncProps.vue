<script setup lang="ts">
import { now } from '../sleep'

defineProps<{ message: string }>()

const renderedAt = now()
</script>

<template>
  <div class="page">
    <h1>Sync props</h1>
    <p>{{ message }}</p>
    <p class="muted">Rendered at {{ renderedAt }}</p>
  </div>
</template>
