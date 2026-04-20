<script setup lang="tsx">
import { AddCircle } from '@vicons/ionicons5';
import { NButton, NDataTable, NGrid, NGi, NIcon, NInput, NPopconfirm, NSpace, NTag } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import type { DictVo } from '@/types/app';
import { fetchDictDelete, fetchDictList } from '@/service/api';
import AppendDialog from '@/components/features/dict/AppendDialog.vue';
import DictValuesInfo from '@/components/features/dict/DictValuesInfo.vue';
import SearchTablePageLayout from '@/components/pages/SearchTablePageLayout.vue';

definePageMeta({
  title: '字典管理'
});

interface RowData extends DictVo {
  key: string;
}

const searchParams = ref({
  name: '',
  code: ''
});

const loading = ref(false);
const tableData = ref<RowData[]>([]);
const showAppendDialog = ref(false);
const showDictValuesInfo = ref(false);
const editData = ref<DictVo | null>(null);
const currentDictCode = ref('');
const currentDictId = ref('');

const pagination = reactive({
  page: 1,
  pageSize: 20,
  pageSizes: [20, 50, 100, 200],
  showSizePicker: true,
  itemCount: 0,
  prefix: ({ itemCount }: { itemCount: number }) => `共 ${itemCount} 条`,
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

const columns = ref<DataTableColumns<RowData>>([
  { type: 'selection', width: 48, fixed: 'left' },
  {
    title: '#',
    key: 'index',
    width: 70,
    align: 'center',
    render: (_, index) => String(index + 1)
  },
  { title: '字典名称', key: 'name', minWidth: 180, fixed: 'left' },
  { title: '字典编码', key: 'code', minWidth: 180, fixed: 'left' },
  {
    title: '状态',
    key: 'status',
    width: 90,
    align: 'center',
    render: row => (
      <NTag type={row.status === 1 ? 'success' : 'error'} bordered={false}>
        {row.status === 1 ? '启用' : '禁用'}
      </NTag>
    )
  },
  { title: '创建时间', key: 'createdAt', width: 180 },
  { title: '更新时间', key: 'updatedAt', width: 180 },
  { title: '描述', key: 'description', minWidth: 220 },
  {
    title: '操作',
    key: 'actions',
    width: 220,
    align: 'center',
    fixed: 'right',
    render: row => (
      <div class="em-table-actions">
        <NButton size="small" quaternary type="primary" onClick={() => handleViewDictValues(row)}>
          字典值
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
            default: () => '确认删除这条字典吗？'
          }}
        </NPopconfirm>
      </div>
    )
  }
]);

onMounted(() => {
  loadData();
});

async function loadData() {
  loading.value = true;

  try {
    const { data } = await fetchDictList({
      pageNum: pagination.page,
      pageSize: pagination.pageSize,
      name: searchParams.value.name || undefined,
      code: searchParams.value.code || undefined
    });

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
  searchParams.value = { name: '', code: '' };
  pagination.page = 1;
  loadData();
}

function handleAdd() {
  editData.value = null;
  showAppendDialog.value = true;
}

function handleEdit(row: RowData) {
  editData.value = row;
  showAppendDialog.value = true;
}

function handleViewDictValues(row: RowData) {
  currentDictCode.value = row.code || '';
  currentDictId.value = row.id || '';
  showDictValuesInfo.value = true;
}

async function handleDelete(row: RowData) {
  if (!row.id) {
    return;
  }

  const { error } = await fetchDictDelete(row.id);
  if (error) {
    return;
  }
  window.$message?.success('字典删除成功');
  await loadData();
}

function handleAppendClose() {
  showAppendDialog.value = false;
  loadData();
}
</script>

<template>
  <SearchTablePageLayout :pagination="pagination" @refresh="loadData">
    <template #searchBox>
      <NGrid :cols="12">
        <NGi span="12">
          <NSpace justify="end">
            <NInput v-model:value="searchParams.name" placeholder="请输入字典名称" clearable style="width: 180px" @keyup.enter="handleSearch" />
            <NInput v-model:value="searchParams.code" placeholder="请输入字典编码" clearable style="width: 180px" @keyup.enter="handleSearch" />
            <NButton type="primary" @click="handleSearch">查询</NButton>
            <NButton @click="handleReset">重置</NButton>
          </NSpace>
        </NGi>
      </NGrid>
    </template>

    <template #h-btns>
      <NButton type="primary" @click="handleAdd">
        <NIcon class="mr-6px" size="18"><AddCircle /></NIcon>
        新增字典
      </NButton>
    </template>

    <NDataTable
      :bordered="false"
      :single-line="false"
      :columns="columns"
      :data="tableData"
      :loading="loading"
      :pagination="pagination"
      flex-height
      :row-key="row => row.key"
      :style="{ height: '100%' }"
    />

    <AppendDialog :show="showAppendDialog" :data="editData" @close="handleAppendClose" />
    <DictValuesInfo
      :show="showDictValuesInfo"
      :dict-code="currentDictCode"
      :dict-id="currentDictId"
      @close="showDictValuesInfo = false"
    />
  </SearchTablePageLayout>
</template>
