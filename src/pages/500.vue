<script setup lang="ts">
import { NButton, NResult } from 'naive-ui';

definePageMeta({
  layout: 'blank'
});
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <NResult status="500" title="500" description="服务异常，请稍后重试">
      <template #footer>
        <NButton type="primary" @click="navigateTo('/home')">返回首页</NButton>
      </template>
    </NResult>
  </div>
</template>
