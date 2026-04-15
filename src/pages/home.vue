<script setup lang="ts">
import { NAlert, NCard, NGrid, NGi, NSpace, NStatistic } from 'naive-ui';

definePageMeta({
  title: '首页'
});

const authStore = useAuthStore();

const cards = [
  { title: '系统菜单', value: '后端动态加载', color: '#2080f0' },
  { title: '页面框架', value: 'Nuxt 3 SPA', color: '#18a058' },
  { title: '组件风格', value: 'Naive UI', color: '#f0a020' },
  { title: '样式方案', value: 'UnoCSS', color: '#d03050' }
];
</script>

<template>
  <NSpace vertical :size="16" class="p-16px">
    <NAlert title="提示" type="warning">
      当前首页为 Nuxt 迁移版演示面板，视觉已收敛到旧版浅色后台风格。
    </NAlert>

    <NCard :bordered="false" class="card-wrapper">
      <div class="text-24px font-700">
        你好，{{ authStore.userInfo?.username || '管理员' }}
      </div>
      <div class="mt-10px text-#666 leading-7">
        当前系统菜单、登录态和业务页面都已接入新的 Nuxt 结构。
      </div>
    </NCard>

    <NGrid :cols="24" :x-gap="16" :y-gap="16">
      <NGi v-for="item in cards" :key="item.title" :span="6">
        <NCard :bordered="false" class="card-wrapper">
          <NStatistic :label="item.title" :value="item.value">
            <template #prefix>
              <div class="h-8px w-8px rounded-full" :style="{ backgroundColor: item.color }" />
            </template>
          </NStatistic>
        </NCard>
      </NGi>
    </NGrid>
  </NSpace>
</template>
