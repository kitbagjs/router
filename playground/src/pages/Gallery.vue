<script setup lang="ts">
import { RouterLink, photos } from '../router'
</script>

<template>
  <div class="page">
    <h1>Gallery</h1>
    <p>Only the square you click carries <code>view-transition-name: photo</code>, set from the link's <code>isTransitioning</code> slot prop while the navigation loads. The browser morphs it into the large version on the next page.</p>
    <div class="gallery">
      <router-link
        v-for="(color, index) in photos"
        :key="color"
        :to="(resolve) => resolve('photo', { id: String(index) })"
        class="thumb"
        v-slot="{ isTransitioning }"
      >
        <span class="fill" :style="{ background: color, viewTransitionName: isTransitioning ? 'photo' : 'none' }" />
      </router-link>
    </div>
  </div>
</template>
