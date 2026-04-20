<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { ArrowBackOutline } from '@vicons/ionicons5';
import { NButton, NEmpty, NIcon, NSpin } from 'naive-ui';
import InfoGridCard from '@/components/common/InfoGridCard.vue';
import InfoPageLayout from '@/components/pages/InfoPageLayout.vue';
import { fetchUserById } from '@/service/api';
import type { UserVo } from '@/types/app';

definePageMeta({
  title: '人员详情'
});

const route = useRoute();

const loading = ref(false);
const detail = ref<UserVo | null>(null);

const userId = computed(() => String(route.params.id || ''));
const detailItems = computed(() => [
  { label: '工号', text: detail.value?.employeeNo || '-' },
  { label: '姓名', text: detail.value?.name || detail.value?.username || '-' },
  { label: '登录账号', text: detail.value?.account || '-' },
  { label: '所属部门', text: detail.value?.departmentName || '-' },
  { label: '用户类型', dictCode: 'user_type', dictValue: detail.value?.userType, fallbackLabel: detail.value?.userTypeLabel || '-' },
  { label: '岗位名称', dictCode: 'employee_position', dictValue: detail.value?.positionName, fallbackLabel: detail.value?.positionNameLabel || '-' },
  { label: '部门负责人', text: detail.value?.leaderFlag ? '是' : '否' },
  { label: '性别', dictCode: 'employee_gender', dictValue: detail.value?.gender },
  { label: '出生日期', text: detail.value?.birthday || '-' },
  { label: '手机号', text: detail.value?.phone || '-' },
  { label: '邮箱', text: detail.value?.email || '-' },
  { label: '头像地址', text: detail.value?.avatar || '-' },
  { label: '入职日期', text: detail.value?.entryDate || '-' },
  { label: '任职状态', dictCode: 'employee_job_status', dictValue: detail.value?.jobStatus },
  { label: '工作状态', dictCode: 'employee_work_status', dictValue: detail.value?.workStatus },
  { label: '账号状态', dictCode: 'employee_account_status', dictValue: detail.value?.accountStatus },
  { label: '创建时间', text: detail.value?.createdAt || '-' },
  { label: '更新时间', text: detail.value?.updatedAt || '-' }
]);

watch(userId, () => {
  loadDetail();
});

onMounted(() => {
  loadDetail();
});

async function loadDetail() {
  if (!userId.value) {
    detail.value = null;
    return;
  }

  loading.value = true;

  try {
    const { data, error } = await fetchUserById(userId.value);
    if (error) {
      detail.value = null;
      return;
    }

    detail.value = data || null;
  } finally {
    loading.value = false;
  }
}

</script>

<template>
  <InfoPageLayout>
    <template #title>人员详情</template>

    <template #actions>
      <NButton @click="navigateTo('/user-manager/index')">
        <template #icon>
          <NIcon><ArrowBackOutline /></NIcon>
        </template>
        返回列表
      </NButton>
    </template>

    <template #contentBox>
      <NSpin :show="loading">
        <NEmpty v-if="!detail" description="暂无人员信息" />

        <InfoGridCard v-else :items="detailItems" auto-columns :min-item-width="250" :max-columns="4" />
      </NSpin>
    </template>
  </InfoPageLayout>
</template>
