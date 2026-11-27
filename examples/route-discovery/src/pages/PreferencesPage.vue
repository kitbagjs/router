<script setup lang="ts">
  import AddressForm from '../components/AddressForm.vue'
  import SessionBadge from '../components/SessionBadge.vue'
</script>

<template>
  <h1>Make yourself<br>at home.</h1>
  <p class="intro">
    Both layout and child use the session. The child inherits one attachment from its generated parent.
  </p>
  <SessionBadge />
  <AddressForm />
</template>
