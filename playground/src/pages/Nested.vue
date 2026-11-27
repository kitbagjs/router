<script setup lang="ts">
import { RouterLink, RouterView } from '../router'
</script>

<template>
  <div class="page">
    <h1>Nested routes</h1>
    <p>The child route sets <code>viewTransition: ['fade-up']</code>, which combines with whatever the router's types callback returns. Its props also take 300ms.</p>
    <p>
      <router-link :to="(resolve) => resolve('nestedChild', { which: 'one' })">Child one</router-link>
      <router-link :to="(resolve) => resolve('nestedChild', { which: 'two' })">Child two</router-link>
    </p>
    <router-view />
  </div>
</template>
