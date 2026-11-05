<script setup lang="ts">
import { RouterLink } from '../router'
import { now } from '../sleep'

defineProps<{ id: string, loadedAt: string }>()

const renderedAt = now()
</script>

<template>
  <div class="page">
    <h1>Async props, id {{ id }}</h1>
    <p>The props getter sleeps 800ms. The previous page stayed on screen until it resolved, then the transition ran with this content already in place.</p>
    <p class="muted">Props loaded at {{ loadedAt }}, rendered at {{ renderedAt }}</p>
    <p>
      Same route, different param (the types callback returns no direction, so it cross fades):
      <router-link v-for="n in ['1', '2', '3']" :key="n" :to="(resolve) => resolve('asyncProps', { id: n })"> {{ n }} </router-link>
    </p>
  </div>
</template>
