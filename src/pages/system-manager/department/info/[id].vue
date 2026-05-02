<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { ArrowBackOutline } from '@vicons/ionicons5';
import { NButton, NEmpty, NIcon, NSpin } from 'naive-ui';
import InfoGridCard from '@/components/common/InfoGridCard.vue';
import InfoPageLayout from '@/components/pages/InfoPageLayout.vue';
import { fetchDepartmentById, fetchDepartmentTreeList } from '@/service/api';
import type { DepartmentVo } from '@/types/app';

definePageMeta({
  title: '部门详情'
});

const route = useRoute();

const loading = ref(false);
const detail = ref<DepartmentVo | null>(null);
const departmentMap = ref<Record<string, DepartmentVo>>({});

const departmentId = computed(() => String(route.params.id || ''));
const parentName = computed(() => {
  const parentId = detail.value?.parentId;

  if (!parentId || parentId === '0') {
    return '顶级部门';
  }

  return departmentMap.value[parentId]?.name || parentId;
});
const detailItems = computed(() => [
  { label: '部门名称', text: detail.value?.name || '-' },
  { label: '上级部门', text: parentName.value },
  { label: '负责人', text: detail.value?.leaderName || '-' },
  { label: '默认角色', text: detail.value?.defaultRoleName || '-' },
  { label: '排序', text: detail.value?.sort ?? 0 },
  { label: '部门状态', dictCode: 'department_status', dictValue: detail.value?.status },
  { label: '创建时间', text: detail.value?.createdAt || '-' },
  { label: '更新时间', text: detail.value?.updatedAt || '-' },
  { label: '备注', text: detail.value?.remark || '-' }
]);

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

        <InfoGridCard v-else :items="detailItems" auto-columns :min-item-width="220" :max-columns="4" :plain="true" />
      </NSpin>
    </template>
  </InfoPageLayout>
</template>
