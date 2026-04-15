<script setup lang="ts">
import { NButton, NResult } from 'naive-ui';

definePageMeta({
  layout: 'blank'
});
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <NResult status="404" title="404" description="页面不存在">
      <template #footer>
        <NButton type="primary" @click="navigateTo('/home')">返回首页</NButton>
      </template>
    </NResult>
  </div>
</template>
