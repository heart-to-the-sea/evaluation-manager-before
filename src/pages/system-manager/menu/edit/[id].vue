<script setup lang="ts">
import { ArrowBackOutline } from '@vicons/ionicons5';
import { NButton, NCard, NDescriptions, NDescriptionsItem, NIcon, NSkeleton } from 'naive-ui';
import type { MenuVo } from '@/types/app';
import { fetchMenuById } from '@/service/api';
import InfoPageLayout from '@/components/pages/InfoPageLayout.vue';

definePageMeta({
  title: '菜单详情'
});

const route = useRoute();
const loading = ref(false);
const menuInfo = ref<MenuVo | null>(null);

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
    <template #contentBox>
      <NCard :bordered="false" class="card-wrapper">
        <div class="mb-16px flex items-center justify-between">
          <div class="text-18px font-600">菜单详情</div>
          <NButton @click="navigateTo('/system-manager/menu')">
            <template #icon>
              <NIcon><ArrowBackOutline /></NIcon>
            </template>
            返回列表
          </NButton>
        </div>

        <NSkeleton v-if="loading" text :repeat="6" />

        <NDescriptions v-else bordered label-placement="left" :column="2">
          <NDescriptionsItem label="菜单名称">{{ menuInfo?.label || '-' }}</NDescriptionsItem>
          <NDescriptionsItem label="菜单标识">{{ menuInfo?.key || '-' }}</NDescriptionsItem>
          <NDescriptionsItem label="页面标识">{{ menuInfo?.routeKey || '-' }}</NDescriptionsItem>
          <NDescriptionsItem label="页面路径">{{ menuInfo?.routePath || '-' }}</NDescriptionsItem>
          <NDescriptionsItem label="菜单类型">{{ menuInfo?.menuType === 'DIRECTORY' ? '目录' : '菜单' }}</NDescriptionsItem>
          <NDescriptionsItem label="布局方案">{{ menuInfo?.component || '自动匹配' }}</NDescriptionsItem>
          <NDescriptionsItem label="图标">{{ menuInfo?.icon || '-' }}</NDescriptionsItem>
          <NDescriptionsItem label="排序">{{ menuInfo?.sort ?? 0 }}</NDescriptionsItem>
          <NDescriptionsItem label="状态">{{ menuInfo?.status === 1 ? '启用' : '禁用' }}</NDescriptionsItem>
          <NDescriptionsItem label="缓存">{{ menuInfo?.keepAlive ? '开启' : '关闭' }}</NDescriptionsItem>
        </NDescriptions>
      </NCard>
    </template>
  </InfoPageLayout>
</template>
