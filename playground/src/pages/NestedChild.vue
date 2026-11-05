<script setup lang="ts">
import { now } from '../sleep'

defineProps<{ which: string }>()

const renderedAt = now()
</script>

<template>
  <div class="nested-content">
    <strong>Child {{ which }}</strong>
    <p class="muted">Rendered at {{ renderedAt }}. Only this box animates with fade-up, the rest of the page has no transition name change.</p>
  </div>
</template>
