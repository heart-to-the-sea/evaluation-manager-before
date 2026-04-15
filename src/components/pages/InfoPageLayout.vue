<script setup lang="ts">
import { NCard } from 'naive-ui';
</script>

<template>
  <div class="info-page-layout">
    <NCard class="card-wrapper info-card" :bordered="false">
      <slot name="contentBox">123</slot>
    </NCard>
  </div>
</template>

<style scoped>
.info-page-layout {
  display: flex;
  height: 100%;
  flex-direction: column;
  padding: 16px;
}

.info-card {
  height: 100%;
}
</style>
