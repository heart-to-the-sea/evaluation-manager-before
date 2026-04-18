<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { ArrowBackOutline } from '@vicons/ionicons5';
import { NButton, NDescriptions, NDescriptionsItem, NEmpty, NIcon, NSpin } from 'naive-ui';
import DictTag from '@/components/common/DictTag.vue';
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

        <NDescriptions v-else bordered label-placement="left" :column="2">
          <NDescriptionsItem label="工号">{{ detail.employeeNo || '-' }}</NDescriptionsItem>
          <NDescriptionsItem label="姓名">{{ detail.name || detail.username || '-' }}</NDescriptionsItem>
          <NDescriptionsItem label="登录账号">{{ detail.account || '-' }}</NDescriptionsItem>
          <NDescriptionsItem label="所属部门">{{ detail.departmentName || '-' }}</NDescriptionsItem>
          <NDescriptionsItem label="用户类型"><DictTag dict-code="user_type" :value="detail.userType" :fallback-label="detail.userTypeLabel || '-'" /></NDescriptionsItem>
          <NDescriptionsItem label="岗位名称"><DictTag dict-code="employee_position" :value="detail.positionName" :fallback-label="detail.positionNameLabel || '-'" /></NDescriptionsItem>
          <NDescriptionsItem label="部门负责人">{{ detail.leaderFlag ? '是' : '否' }}</NDescriptionsItem>
          <NDescriptionsItem label="性别"><DictTag dict-code="employee_gender" :value="detail.gender" /></NDescriptionsItem>
          <NDescriptionsItem label="出生日期">{{ detail.birthday || '-' }}</NDescriptionsItem>
          <NDescriptionsItem label="手机号">{{ detail.phone || '-' }}</NDescriptionsItem>
          <NDescriptionsItem label="邮箱">{{ detail.email || '-' }}</NDescriptionsItem>
          <NDescriptionsItem label="头像地址">{{ detail.avatar || '-' }}</NDescriptionsItem>
          <NDescriptionsItem label="入职日期">{{ detail.entryDate || '-' }}</NDescriptionsItem>
          <NDescriptionsItem label="任职状态">
            <DictTag dict-code="employee_job_status" :value="detail.jobStatus" />
          </NDescriptionsItem>
          <NDescriptionsItem label="工作状态">
            <DictTag dict-code="employee_work_status" :value="detail.workStatus" />
          </NDescriptionsItem>
          <NDescriptionsItem label="账号状态">
            <DictTag dict-code="employee_account_status" :value="detail.accountStatus" />
          </NDescriptionsItem>
          <NDescriptionsItem label="创建时间">{{ detail.createdAt || '-' }}</NDescriptionsItem>
          <NDescriptionsItem label="更新时间">{{ detail.updatedAt || '-' }}</NDescriptionsItem>
        </NDescriptions>
      </NSpin>
    </template>
  </InfoPageLayout>
</template>
