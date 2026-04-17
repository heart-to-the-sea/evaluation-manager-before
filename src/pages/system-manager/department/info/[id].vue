<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { ArrowBackOutline } from '@vicons/ionicons5';
import { NButton, NDescriptions, NDescriptionsItem, NEmpty, NIcon, NSpin, NTag } from 'naive-ui';
import InfoPageLayout from '@/components/pages/InfoPageLayout.vue';
import { useDict } from '@/composables/use-dict';
import { fetchDepartmentById, fetchDepartmentTreeList } from '@/service/api';
import type { DepartmentVo } from '@/types/app';

definePageMeta({
  title: '部门详情'
});

const route = useRoute();

const loading = ref(false);
const detail = ref<DepartmentVo | null>(null);
const departmentMap = ref<Record<string, DepartmentVo>>({});

const departmentStatusDict = useDict('department_status');

const departmentId = computed(() => String(route.params.id || ''));
const parentName = computed(() => {
  const parentId = detail.value?.parentId;

  if (!parentId || parentId === '0') {
    return '顶级部门';
  }

  return departmentMap.value[parentId]?.name || parentId;
});

watch(departmentId, () => {
  loadDetail();
});

onMounted(async () => {
  await loadDepartmentMap();
  await loadDetail();
});

async function loadDepartmentMap() {
  const { data, error } = await fetchDepartmentTreeList();
  if (error) {
    return;
  }

  const map: Record<string, DepartmentVo> = {};
  collectDepartmentMap(data || [], map);
  departmentMap.value = map;
}

function collectDepartmentMap(list: DepartmentVo[], result: Record<string, DepartmentVo>) {
  list.forEach(item => {
    if (item.id) {
      result[item.id] = item;
    }

    if (item.children?.length) {
      collectDepartmentMap(item.children, result);
    }
  });
}

async function loadDetail() {
  if (!departmentId.value) {
    detail.value = null;
    return;
  }

  loading.value = true;

  try {
    const { data, error } = await fetchDepartmentById(departmentId.value);
    if (error) {
      detail.value = null;
      return;
    }

    detail.value = data || null;
  } finally {
    loading.value = false;
  }
}

function getStatusType(status?: string) {
  return status === '1' ? 'success' : 'error';
}
</script>

<template>
  <InfoPageLayout>
    <template #title>部门详情</template>

    <template #actions>
      <NButton @click="navigateTo('/system-manager/department')">
        <template #icon>
          <NIcon><ArrowBackOutline /></NIcon>
        </template>
        返回列表
      </NButton>
    </template>

    <template #contentBox>
      <NSpin :show="loading">
        <NEmpty v-if="!detail" description="暂无部门信息" />

        <NDescriptions v-else bordered label-placement="left" :column="2">
          <NDescriptionsItem label="部门名称">{{ detail.name || '-' }}</NDescriptionsItem>
          <NDescriptionsItem label="上级部门">{{ parentName }}</NDescriptionsItem>
          <NDescriptionsItem label="负责人">{{ detail.leaderName || '-' }}</NDescriptionsItem>
          <NDescriptionsItem label="排序">{{ detail.sort ?? 0 }}</NDescriptionsItem>
          <NDescriptionsItem label="部门状态">
            <NTag :bordered="false" :type="getStatusType(detail.status)">
              {{ departmentStatusDict.getLabel(detail.status) || '-' }}
            </NTag>
          </NDescriptionsItem>
          <NDescriptionsItem label="创建时间">{{ detail.createdAt || '-' }}</NDescriptionsItem>
          <NDescriptionsItem label="更新时间">{{ detail.updatedAt || '-' }}</NDescriptionsItem>
          <NDescriptionsItem label="备注">{{ detail.remark || '-' }}</NDescriptionsItem>
        </NDescriptions>
      </NSpin>
    </template>
  </InfoPageLayout>
</template>
