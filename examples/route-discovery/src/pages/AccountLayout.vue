<script setup lang="ts">
  import { RouterView } from '@kitbag/router'
  import SessionBadge from '../components/SessionBadge.vue'
</script>

<template>
  <p class="eyebrow">
    Parent and child routes
  </p>
  <SessionBadge />
  <RouterView />
</template>
