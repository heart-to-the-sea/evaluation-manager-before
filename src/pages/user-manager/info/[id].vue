<script setup lang="ts">
import { ArrowBackOutline } from '@vicons/ionicons5';
import { NButton, NCard, NDescriptions, NDescriptionsItem, NIcon } from 'naive-ui';
import InfoPageLayout from '@/components/pages/InfoPageLayout.vue';

definePageMeta({
  title: '用户详情'
});

const route = useRoute();
const userId = computed(() => String(route.params.id || ''));

const profile = computed(() => ({
  account: `user_${userId.value}`,
  username: `演示用户${userId.value}`,
  dept: '研发部',
  gender: Number(userId.value) % 2 === 0 ? '女' : '男',
  birthday: '1995-01-01',
  status: '启用'
}));
</script>

<template>
  <InfoPageLayout>
    <template #contentBox>
      <NCard :bordered="false" class="card-wrapper">
        <div class="mb-16px flex items-center justify-between">
          <div class="text-18px font-600">用户详情</div>
          <NButton @click="navigateTo('/user-manager/index')">
            <template #icon>
              <NIcon><ArrowBackOutline /></NIcon>
            </template>
            返回列表
          </NButton>
        </div>

        <NDescriptions bordered label-placement="left" :column="2">
          <NDescriptionsItem label="用户 ID">{{ userId }}</NDescriptionsItem>
          <NDescriptionsItem label="账户">{{ profile.account }}</NDescriptionsItem>
          <NDescriptionsItem label="用户名">{{ profile.username }}</NDescriptionsItem>
          <NDescriptionsItem label="部门">{{ profile.dept }}</NDescriptionsItem>
          <NDescriptionsItem label="性别">{{ profile.gender }}</NDescriptionsItem>
          <NDescriptionsItem label="生日">{{ profile.birthday }}</NDescriptionsItem>
          <NDescriptionsItem label="账户状态">{{ profile.status }}</NDescriptionsItem>
          <NDescriptionsItem label="说明">当前页面为 Nuxt 迁移后的演示详情页</NDescriptionsItem>
        </NDescriptions>
      </NCard>
    </template>
  </InfoPageLayout>
</template>
