<script setup lang="ts">
interface Props {
  inverted?: boolean;
}

withDefaults(defineProps<Props>(), {
  inverted: false
});
</script>

<template>
  <div class="dark-mode-container transition-300" :class="{ 'dark-mode-container--inverted': inverted }">
    <slot />
  </div>
</template>

<style scoped>
.dark-mode-container {
  background: rgb(var(--container-bg-color));
  color: rgb(var(--base-text-color));
  transition:
    background-color 0.3s ease,
    color 0.3s ease,
    border-color 0.3s ease,
    box-shadow 0.3s ease;
}

.dark-mode-container--inverted {
  background: rgb(var(--inverted-bg-color));
  color: rgb(255 255 255 / 92%);
}

.dark-mode-container--inverted :deep(.n-menu),
.dark-mode-container--inverted :deep(.n-menu-item-content),
.dark-mode-container--inverted :deep(.n-menu-item-content-header),
.dark-mode-container--inverted :deep(.n-menu-item-content__icon),
.dark-mode-container--inverted :deep(.n-menu-item-content-arrow),
.dark-mode-container--inverted :deep(.n-button),
.dark-mode-container--inverted :deep(.logo-desc) {
  color: inherit;
}
</style>
