<script setup lang="tsx">
import { computed, h, onMounted, ref } from 'vue';
import { AddCircle, ChevronDownOutline, ChevronUpOutline } from '@vicons/ionicons5';
import { NButton, NDataTable, NGrid, NGi, NIcon, NInput, NPopconfirm, NSpace } from 'naive-ui';
import type { DataTableColumns, DataTableRowKey } from 'naive-ui';
import DictSelect from '@/components/common/DictSelect.vue';
import DictTag from '@/components/common/DictTag.vue';
import DepartmentDialog from '@/components/features/department/DepartmentDialog.vue';
import SearchTablePageLayout from '@/components/pages/SearchTablePageLayout.vue';
import { fetchDepartmentDelete, fetchDepartmentTreeList } from '@/service/api';
import type { DepartmentVo } from '@/types/app';

definePageMeta({
  title: '部门管理'
});

const searchParams = ref({
  name: '',
  status: null as string | null
});

const loading = ref(false);
const departmentTree = ref<DepartmentVo[]>([]);
const expandedRowKeys = ref<string[]>([]);
const showDialog = ref(false);
const editData = ref<DepartmentVo | null>(null);

const columns = computed<DataTableColumns<DepartmentVo>>(() => [
  {
    title: '部门名称',
    key: 'name',
    tree: true,
    minWidth: 220,
    render: row => row.name || '-'
  },
  {
    title: '负责人',
    key: 'leaderName',
    minWidth: 140,
    render: row => row.leaderName || '-'
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    align: 'center',
    render: row => <DictTag dictCode="department_status" value={row.status} />
  },
  {
    title: '排序',
    key: 'sort',
    width: 80,
    align: 'center',
    render: row => String(row.sort ?? 0)
  },
  {
    title: '备注',
    key: 'remark',
    minWidth: 220,
    render: row => row.remark || '-'
  },
  {
    title: '更新时间',
    key: 'updatedAt',
    width: 180,
    render: row => row.updatedAt || '-'
  },
  {
    title: '操作',
    key: 'actions',
    width: 260,
    fixed: 'right',
    align: 'center',
    render: row => (
      <div class="em-table-actions">
        <NButton size="small" quaternary type="primary" onClick={() => navigateTo(`/system-manager/department/info/${row.id}`)}>
          详情
        </NButton>
        <NButton size="small" quaternary type="primary" onClick={() => handleAddChild(row)}>
          新增子级
        </NButton>
        <NButton size="small" quaternary type="primary" onClick={() => handleEdit(row)}>
          编辑
        </NButton>
        <NPopconfirm onPositiveClick={() => handleDelete(row)}>
          {{
            trigger: () => (
              <NButton size="small" quaternary type="error">
                删除
              </NButton>
            ),
            default: () => '确认删除该部门吗？'
          }}
        </NPopconfirm>
      </div>
    )
  }
]);

onMounted(() => {
  loadData();
});

function collectExpandedKeys(list: DepartmentVo[]) {
  return list.reduce<string[]>((result, item) => {
    if (item.id && item.children?.length) {
      result.push(item.id);
      result.push(...collectExpandedKeys(item.children));
    }

    return result;
  }, []);
}

async function loadData() {
  loading.value = true;

  try {
    const { data, error } = await fetchDepartmentTreeList({
      name: searchParams.value.name || undefined,
      status: searchParams.value.status || undefined
    });

    if (error) {
      return;
    }

    departmentTree.value = data || [];
    expandedRowKeys.value = collectExpandedKeys(departmentTree.value);
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  loadData();
}

function handleReset() {
  searchParams.value = {
    name: '',
    status: null
  };
  loadData();
}

function handleAddRoot() {
  editData.value = {
    parentId: '0',
    sort: 0,
    status: '1'
  };
  showDialog.value = true;
}

function handleAddChild(row: DepartmentVo) {
  editData.value = {
    parentId: row.id,
    sort: 0,
    status: '1'
  };
  showDialog.value = true;
}

function handleEdit(row: DepartmentVo) {
  editData.value = { ...row };
  showDialog.value = true;
}

async function handleDelete(row: DepartmentVo) {
  if (!row.id) {
    return;
  }

  const { error } = await fetchDepartmentDelete(row.id);
  if (error) {
    return;
  }

  window.$message?.success('部门删除成功');
  await loadData();
}

function handleExpandAll() {
  expandedRowKeys.value = collectExpandedKeys(departmentTree.value);
}

function handleCollapseAll() {
  expandedRowKeys.value = [];
}

function handleExpandedKeysChange(keys: DataTableRowKey[]) {
  expandedRowKeys.value = keys.map(String);
}

async function handleDialogClose(submitted = false) {
  showDialog.value = false;
  editData.value = null;

  if (submitted) {
    await loadData();
  }
}
</script>

<template>
  <SearchTablePageLayout @refresh="loadData">
    <template #searchBox>
      <NGrid :cols="12">
        <NGi span="12">
          <NSpace justify="end">
            <NInput v-model:value="searchParams.name" clearable placeholder="请输入部门名称" style="width: 180px" @keyup.enter="handleSearch" />
            <DictSelect v-model:model-value="searchParams.status" dict-code="department_status" clearable placeholder="部门状态" style="width: 140px" />
            <NButton type="primary" @click="handleSearch">查询</NButton>
            <NButton @click="handleReset">重置</NButton>
          </NSpace>
        </NGi>
      </NGrid>
    </template>

    <template #h-btns>
      <NButton type="primary" class="mr-8px" @click="handleAddRoot">
        <NIcon class="mr-6px" size="18"><AddCircle /></NIcon>
        新增部门
      </NButton>
      <NButton class="mr-8px" @click="handleExpandAll">
        <NIcon class="mr-6px" size="16"><ChevronDownOutline /></NIcon>
        全部展开
      </NButton>
      <NButton @click="handleCollapseAll">
        <NIcon class="mr-6px" size="16"><ChevronUpOutline /></NIcon>
        全部收起
      </NButton>
    </template>

    <NDataTable
      :bordered="false"
      :single-line="false"
      :columns="columns"
      :data="departmentTree"
      :loading="loading"
      :pagination="false"
      :expanded-row-keys="expandedRowKeys"
      :row-key="row => row.id || ''"
      flex-height
      :style="{ height: '100%' }"
      @update:expanded-row-keys="handleExpandedKeysChange"
    />

    <DepartmentDialog :show="showDialog" :data="editData" :department-tree="departmentTree" @close="handleDialogClose" />
  </SearchTablePageLayout>
</template>
