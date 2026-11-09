<script setup lang="ts">
  import AddressForm from '../components/AddressForm.vue'
</script>

<template>
  <p class="eyebrow">
    Nested component discovery
  </p>
  <h1>Where should<br>we send it?</h1>
  <p class="intro">
    CountrySelect lives inside AddressForm. Its loader is attached to checkout automatically.
  </p>
  <AddressForm />
</template>
