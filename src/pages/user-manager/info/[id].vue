<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { ArrowBackOutline } from '@vicons/ionicons5';
import { NButton, NCard, NDescriptions, NDescriptionsItem, NEmpty, NIcon, NSpin, NTag } from 'naive-ui';
import InfoPageLayout from '@/components/pages/InfoPageLayout.vue';
import { useDict } from '@/composables/use-dict';
import { fetchUserById } from '@/service/api';
import type { UserVo } from '@/types/app';

definePageMeta({
  title: '人员详情'
});

const route = useRoute();

const loading = ref(false);
const detail = ref<UserVo | null>(null);

const genderDict = useDict('employee_gender');
const userTypeDict = useDict('user_type');
const jobStatusDict = useDict('employee_job_status');
const workStatusDict = useDict('employee_work_status');
const accountStatusDict = useDict('employee_account_status');
const positionDict = useDict('employee_position');

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

function getAccountStatusType(status?: string) {
  return status === '1' ? 'success' : 'error';
}

function getJobStatusType(status?: string) {
  return status === '1' ? 'success' : 'warning';
}
</script>

<template>
  <InfoPageLayout>
    <template #contentBox>
      <NCard :bordered="false" class="card-wrapper">
        <div class="mb-16px flex items-center justify-between">
          <div class="text-18px font-600">人员详情</div>
          <div class="flex items-center gap-12px">
            <NButton @click="navigateTo('/user-manager/index')">
              <template #icon>
                <NIcon><ArrowBackOutline /></NIcon>
              </template>
              返回列表
            </NButton>
          </div>
        </div>

        <NSpin :show="loading">
          <NEmpty v-if="!detail" description="暂无人员信息" />

          <NDescriptions v-else bordered label-placement="left" :column="2">
            <NDescriptionsItem label="工号">{{ detail.employeeNo || '-' }}</NDescriptionsItem>
            <NDescriptionsItem label="姓名">{{ detail.name || detail.username || '-' }}</NDescriptionsItem>
            <NDescriptionsItem label="登录账号">{{ detail.account || '-' }}</NDescriptionsItem>
            <NDescriptionsItem label="所属部门">{{ detail.departmentName || '-' }}</NDescriptionsItem>
            <NDescriptionsItem label="用户类型">{{ detail.userTypeLabel || userTypeDict.getLabel(detail.userType) || '-' }}</NDescriptionsItem>
            <NDescriptionsItem label="岗位名称">{{ detail.positionNameLabel || positionDict.getLabel(detail.positionName) || '-' }}</NDescriptionsItem>
            <NDescriptionsItem label="部门负责人">{{ detail.leaderFlag ? '是' : '否' }}</NDescriptionsItem>
            <NDescriptionsItem label="性别">{{ genderDict.getLabel(detail.gender) || '-' }}</NDescriptionsItem>
            <NDescriptionsItem label="出生日期">{{ detail.birthday || '-' }}</NDescriptionsItem>
            <NDescriptionsItem label="手机号">{{ detail.phone || '-' }}</NDescriptionsItem>
            <NDescriptionsItem label="邮箱">{{ detail.email || '-' }}</NDescriptionsItem>
            <NDescriptionsItem label="头像地址">{{ detail.avatar || '-' }}</NDescriptionsItem>
            <NDescriptionsItem label="入职日期">{{ detail.entryDate || '-' }}</NDescriptionsItem>
            <NDescriptionsItem label="任职状态">
              <NTag :bordered="false" :type="getJobStatusType(detail.jobStatus)">
                {{ jobStatusDict.getLabel(detail.jobStatus) || '-' }}
              </NTag>
            </NDescriptionsItem>
            <NDescriptionsItem label="工作状态">
              <NTag :bordered="false" type="info">
                {{ workStatusDict.getLabel(detail.workStatus) || '-' }}
              </NTag>
            </NDescriptionsItem>
            <NDescriptionsItem label="账号状态">
              <NTag :bordered="false" :type="getAccountStatusType(detail.accountStatus)">
                {{ accountStatusDict.getLabel(detail.accountStatus) || '-' }}
              </NTag>
            </NDescriptionsItem>
            <NDescriptionsItem label="创建时间">{{ detail.createdAt || '-' }}</NDescriptionsItem>
            <NDescriptionsItem label="更新时间">{{ detail.updatedAt || '-' }}</NDescriptionsItem>
          </NDescriptions>
        </NSpin>
      </NCard>
    </template>
  </InfoPageLayout>
</template>
