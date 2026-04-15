<script setup lang="ts">
import { NCard } from 'naive-ui';

definePageMeta({
  title: '内嵌页面'
});

const route = useRoute();
const iframeUrl = computed(() => decodeURIComponent(String(route.params.url || '')));
</script>

<template>
  <div class="h-full p-16px">
    <NCard :bordered="false" class="h-full card-wrapper">
      <iframe :src="iframeUrl" class="h-[calc(100vh-180px)] w-full border-none" />
    </NCard>
  </div>
</template>
