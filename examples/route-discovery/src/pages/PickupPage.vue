<template>
  <p class="eyebrow">
    Route export name conflicts
  </p>
  <h1>Pick it up.</h1>
  <p class="intro">
    This module and delivery.routes.ts both export a route named destination.
    The generated registry imports them as destination_1 and destination_2.
    Their router names remain shipping and pickup.
  </p>
</template>
