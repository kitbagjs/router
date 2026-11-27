<script setup lang="ts">
import { RouterLink } from '../router'
</script>

<template>
  <div class="page">
    <h1>Route says no</h1>
    <p>This route sets <code>viewTransition: false</code>, which overrides the router option. The header link explicitly overrides that setting, so it still animates while “Animate header links” is checked. Open this route from the link below to test the route option without a navigation override.</p>
    <p><router-link :to="(resolve) => resolve('plain')">Navigate without a link override</router-link></p>
  </div>
</template>
