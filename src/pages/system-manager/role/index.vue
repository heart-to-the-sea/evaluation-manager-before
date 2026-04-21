<script setup lang="tsx">
import { computed, h, onMounted, reactive, ref } from 'vue';
import { AddCircle } from '@vicons/ionicons5';
import { NButton, NDataTable, NGrid, NGi, NIcon, NInput, NPopconfirm, NSpace, NSelect, NTag } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import RoleDialog from '@/components/features/role/RoleDialog.vue';
import SearchTablePageLayout from '@/components/pages/SearchTablePageLayout.vue';
import { useTableSorter } from '@/composables/use-table-sorter';
import { fetchMenuTreeList, fetchRoleById, fetchRoleDelete, fetchRoleList } from '@/service/api';
import type { MenuVo, RoleBo, RoleVo } from '@/types/app';

definePageMeta({
  title: '角色管理'
});

interface RowData extends RoleVo {
  key: string;
}

const searchParams = ref({
  name: '',
  code: '',
  status: null as number | null
});

const loading = ref(false);
const tableData = ref<RowData[]>([]);
const menuTree = ref<MenuVo[]>([]);
const showDialog = ref(false);
const editData = ref<RoleVo | null>(null);
const { handleSorter, getSortOrder, appendSorter, createSorter, createSorterRender } = useTableSorter(() => loadData());
const sortableColumnKeys = new Set(['name', 'code', 'status', 'description', 'updatedAt']);

const pagination = reactive({
  page: 1,
  pageSize: 20,
  pageSizes: [20, 50, 100, 200],
  showSizePicker: true,
  itemCount: 0,
  onChange: (page: number) => {
    pagination.page = page;
    loadData();
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize;
    pagination.page = 1;
    loadData();
  }
});

const statusOptions = [
  { label: '启用', value: 1 },
  { label: '禁用', value: 0 }
];

const columns = computed<DataTableColumns<RowData>>(() =>
  ([{
    title: '#',
    key: 'index',
    width: 70,
    align: 'center',
    render: (_, index) => String((pagination.page - 1) * pagination.pageSize + index + 1)
  }, {
    title: '角色名称',
    key: 'name',
    minWidth: 180,
    render: row => row.name || '-'
  }, {
    title: '角色编码',
    key: 'code',
    minWidth: 180,
    render: row => row.code || '-'
  }, {
    title: '状态',
    key: 'status',
    width: 100,
    align: 'center',
    render: row => h(NTag, { bordered: false, type: row.status === 1 ? 'success' : 'error' }, { default: () => (row.status === 1 ? '启用' : '禁用') })
  }, {
    title: '角色说明',
    key: 'description',
    minWidth: 240,
    render: row => row.description || '-'
  }, {
    title: '更新时间',
    key: 'updatedAt',
    width: 180,
    render: row => row.updatedAt || '-'
  }, {
    title: '操作',
    key: 'actions',
    width: 160,
    fixed: 'right',
    align: 'center',
    render: row => (
      <div class="em-table-actions">
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
            default: () => '确认删除该角色吗？'
          }}
        </NPopconfirm>
      </div>
    )
  }] as DataTableColumns<RowData>).map(column => {
    const columnKey = typeof column.key === 'string' ? column.key : '';
    if (!sortableColumnKeys.has(columnKey)) {
      return column;
    }
    return {
      ...column,
      sorter: createSorter(),
      sortOrder: getSortOrder(columnKey),
      renderSorter: createSorterRender(columnKey)
    };
  })
);

onMounted(async () => {
  await Promise.all([loadData(), loadMenuTree()]);
});

async function loadMenuTree() {
  const { data, error } = await fetchMenuTreeList({ status: 1 });
  if (error) {
    return;
  }
  menuTree.value = data || [];
}

async function loadData() {
  loading.value = true;

  try {
    const { data, error } = await fetchRoleList(appendSorter({
      pageNum: pagination.page,
      pageSize: pagination.pageSize,
      name: searchParams.value.name || undefined,
      code: searchParams.value.code || undefined,
      status: searchParams.value.status ?? undefined
    } as RoleBo));

    if (error) {
      return;
    }

    tableData.value = (data?.records || []).map((item, index) => ({
      ...item,
      key: item.id || `${index}`
    }));
    pagination.itemCount = data?.total || 0;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.page = 1;
  loadData();
}

function handleReset() {
  searchParams.value = {
    name: '',
    code: '',
    status: null
  };
  pagination.page = 1;
  loadData();
}

function handleAdd() {
  editData.value = null;
  showDialog.value = true;
}

async function handleEdit(row: RowData) {
  if (!row.id) {
    return;
  }

  const { data, error } = await fetchRoleById(row.id);
  if (error) {
    return;
  }

  editData.value = data || null;
  showDialog.value = true;
}

async function handleDelete(row: RowData) {
  if (!row.id) {
    return;
  }

  const { error } = await fetchRoleDelete(row.id);
  if (error) {
    return;
  }

  window.$message?.success('角色删除成功');
  await loadData();
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
  <SearchTablePageLayout :pagination="pagination" @refresh="loadData">
    <template #searchBox>
      <NGrid :cols="12">
        <NGi span="12">
          <NSpace justify="end">
            <NInput v-model:value="searchParams.name" clearable placeholder="请输入角色名称" style="width: 180px" @keyup.enter="handleSearch" />
            <NInput v-model:value="searchParams.code" clearable placeholder="请输入角色编码" style="width: 180px" @keyup.enter="handleSearch" />
            <NSelect v-model:value="searchParams.status" clearable :options="statusOptions" placeholder="角色状态" style="width: 140px" />
            <NButton type="primary" @click="handleSearch">查询</NButton>
            <NButton @click="handleReset">重置</NButton>
          </NSpace>
        </NGi>
      </NGrid>
    </template>

    <template #h-btns>
      <NButton type="primary" @click="handleAdd">
        <NIcon class="mr-6px" size="18"><AddCircle /></NIcon>
        新增角色
      </NButton>
    </template>

    <NDataTable
      :bordered="false"
      :single-line="false"
      remote
      :columns="columns"
      :data="tableData"
      :loading="loading"
      :pagination="pagination"
      :row-key="row => row.key"
      flex-height
      :style="{ height: '100%' }"
      @update:sorter="handleSorter"
    />

    <RoleDialog :show="showDialog" :data="editData" :menu-tree="menuTree" @close="handleDialogClose" />
  </SearchTablePageLayout>
</template>
