<script setup lang="ts">
import { ArrowBackOutline } from '@vicons/ionicons5';
import { computed } from 'vue';
import { NButton, NEmpty, NIcon, NSkeleton } from 'naive-ui';
import type { MenuVo } from '@/types/app';
import { fetchMenuById } from '@/service/api';
import InfoGridCard from '@/components/common/InfoGridCard.vue';
import InfoPageLayout from '@/components/pages/InfoPageLayout.vue';

definePageMeta({
  title: '菜单详情'
});

const route = useRoute();
const loading = ref(false);
const menuInfo = ref<MenuVo | null>(null);
const detailItems = computed(() => [
  { label: '菜单名称', text: menuInfo.value?.label || '-' },
  { label: '菜单标识', text: menuInfo.value?.key || '-' },
  { label: '页面标识', text: menuInfo.value?.routeKey || '-' },
  { label: '页面路径', text: menuInfo.value?.routePath || '-' },
  { label: '菜单类型', text: menuInfo.value?.menuType === 'DIRECTORY' ? '目录' : '菜单' },
  { label: '布局方案', text: menuInfo.value?.component || '自动匹配' },
  { label: '图标', text: menuInfo.value?.icon || '-' },
  { label: '排序', text: menuInfo.value?.sort ?? 0 },
  { label: '状态', text: menuInfo.value?.status === 1 ? '启用' : '禁用' },
  { label: '缓存', text: menuInfo.value?.keepAlive ? '开启' : '关闭' }
]);

onMounted(() => {
  loadData();
});

async function loadData() {
  loading.value = true;

  try {
    const { data } = await fetchMenuById(String(route.params.id));
    menuInfo.value = data || null;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <InfoPageLayout>
    <template #title>菜单详情</template>

    <template #actions>
      <NButton @click="navigateTo('/system-manager/menu')">
        <template #icon>
          <NIcon><ArrowBackOutline /></NIcon>
        </template>
        返回列表
      </NButton>
    </template>

    <template #contentBox>
      <NSkeleton v-if="loading" text :repeat="6" />

      <NEmpty v-else-if="!menuInfo" description="暂无菜单信息" />

      <InfoGridCard v-else :items="detailItems" auto-columns :min-item-width="240" :max-columns="4" :plain="true" />
    </template>
  </InfoPageLayout>
</template>
