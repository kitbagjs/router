<script setup lang="ts">
  import AddressForm from '../components/AddressForm.vue'
</script>

<template>
  <p class="eyebrow">
    Existing registrations
  </p>
  <h1>Your profile.</h1>
  <p class="intro">
    This route explicitly attaches countries as “locations”. Discovery reuses that attachment and its options.
  </p>
  <AddressForm />
</template>
