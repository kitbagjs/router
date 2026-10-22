<script setup lang="ts">
import { RouterLink, useRoute, photos } from '../router'
import { computed } from 'vue'

const route = useRoute('photo')
const color = computed(() => photos[Number(route.params.id)])
</script>

<template>
  <div class="page">
    <h1>Photo {{ route.params.id }}</h1>
    <div class="photo" :style="{ background: color }" style="view-transition-name: photo" />
    <p><router-link :to="(resolve) => resolve('gallery')">Back to the gallery</router-link>. Going back the gallery cannot know which square to name, so it cross fades.</p>
  </div>
</template>
