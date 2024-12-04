<template>
  <svg class="bg-icon" aria-hidden="true">
    <use :xlink:href="icon" />
  </svg>
</template>

<script setup>
const props = defineProps({
  icon: {
    type: String,
    default: "",
  },
});
</script>

<style scoped>
.bg-icon {
    width: 1em;
    height: 1em;
    vertical-align: -.15em;
    fill: currentColor;
    overflow: hidden
}
</style>
