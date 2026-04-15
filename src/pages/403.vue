<script setup lang="ts">
import { NButton, NResult } from 'naive-ui';

definePageMeta({
  layout: 'blank'
});
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <NResult status="403" title="403" description="抱歉，您没有访问该页面的权限">
      <template #footer>
        <NButton type="primary" @click="navigateTo('/home')">返回首页</NButton>
      </template>
    </NResult>
  </div>
</template>
