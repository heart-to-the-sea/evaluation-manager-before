<script setup lang="tsx">
import { onMounted, reactive, ref } from 'vue';
import { NButton, NDataTable, NGrid, NGridItem, NIcon, NInput, NPopconfirm, NSpace, NTag } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { AddCircle, RefreshOutline, SearchOutline } from '@vicons/ionicons5';
import type { MaybeArray } from 'naive-ui/es/_utils';
import type { OnUpdateExpandedRowKeys } from 'naive-ui/es/data-table/src/interface';
import { type DictValuesVo, type DictVo, fetchDictDelete, fetchDictList, fetchDictValuesDelete } from '@/service/api';
import SearchTablePageLayout from '@/components/pages/SearchTablePageLayout.vue';
import AppendDialog from './components/AppendDialog.vue';
import DictValuesModal from './components/DictValuesModal.vue';

interface RowData extends DictVo {
  key: number;
}

const searchParams = ref({
  name: '',
  code: ''
});

const data = ref<RowData[]>([]);
const loading = ref(false);

const pagination = reactive({
  page: 1,
  pageSize: 20,
  pageSizes: [20, 50, 100, 200, 500, 1000],
  showSizePicker: true,
  onChange: (page: number) => {
    pagination.page = page;
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize;
  }
});

const columns = ref<DataTableColumns<RowData>>([
  {
    type: 'selection',
    fixed: 'left',
    width: '50px'
  },
  {
    title: '#',
    key: 'key',
    width: 100,
    align: 'center',
    render: (_: any, index: number) => `${index + 1}`
  },
  { title: '字典名称', key: 'name', width: 250, fixed: 'left' },
  { title: '字典编码', key: 'code', width: 250, fixed: 'left' },
  {
    title: '状态',
    key: 'status',
    width: 150,
    align: 'center',
    render: (row: RowData) => (
      <NTag type={row.status === 1 ? 'success' : 'error'} bordered={false}>
        {row.statusLabel || (row.status === 1 ? '启用' : '禁用')}
      </NTag>
    )
  },
  { title: '创建时间', key: 'createdAt', width: 180 },
  { title: '更新时间', key: 'updatedAt', width: 180 },
  { title: '描述', key: 'description', width: '' },
  {
    title: '操作',
    key: 'actions',
    width: 160,
    align: 'center',
    fixed: 'right',
    render: (row: RowData) => (
      <NSpace justify="center" size="small">
        <NButton type="primary" quaternary size="small" onClick={() => handleEdit(row)}>
          编辑
        </NButton>
        <NPopconfirm onPositiveClick={() => handleDelete(row)}>
          {{
            trigger: () => (
              <NButton type="error" quaternary size="small">
                删除
              </NButton>
            ),
            default: () => '确定要删除该字典吗？'
          }}
        </NPopconfirm>
      </NSpace>
    )
  }
]);

const showAppendDialog = ref(false);
const editData = ref<DictVo | null>(null);
const showDictValuesModal = ref(false);
const editingDictValues = ref<DictValuesVo | null>(null);
const currentDictKey = ref<string>('');

async function loadData() {
  loading.value = true;
  try {
    const { data: res } = await fetchDictList({
      pageNum: pagination.page,
      pageSize: pagination.pageSize,
      name: searchParams.value.name || undefined,
      code: searchParams.value.code || undefined
    });
    data.value = (res?.records || []).map((item, index) => ({
      ...item,
      key: item.id || index
    })) as RowData[];
  } catch (error) {
    console.error('加载字典列表失败:', error);
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

async function handleDelete(row: RowData) {
  if (!row.id) return;
  try {
    await fetchDictDelete(row.id);
    window.$message?.success('删除成功');
    loadData();
  } catch (error) {
    console.error('删除失败:', error);
  }
}

function handleAppendClose() {
  showAppendDialog.value = false;
  loadData();
}

function handleDictValuesModalClose() {
  showDictValuesModal.value = false;
  editingDictValues.value = null;
}
onMounted(() => {
  loadData();
});
</script>

<template>
  <SearchTablePageLayout>
    <template #searchBox>
      <NGrid :cols="12">
        <NGi span="12">
          <NSpace justify="end">
            <NInput
              v-model:value="searchParams.name"
              placeholder="请输入字典名称"
              clearable
              style="width: 150px"
              @keyup.enter="handleSearch"
            />
            <NInput
              v-model:value="searchParams.code"
              placeholder="请输入字典编码"
              clearable
              style="width: 150px"
              @keyup.enter="handleSearch"
            />
            <NButton type="primary" @click="handleSearch">查询</NButton>
            <NButton type="default" @click="handleReset">重置</NButton>
          </NSpace>
        </NGi>
      </NGrid>
    </template>
    <template #h-btns>
      <NButton type="primary" @click="handleAdd">
        <NIcon style="margin-right: 6px" size="18"><AddCircle /></NIcon>
        新增
      </NButton>
    </template>
    <NDataTable
      :bordered="false"
      :single-line="false"
      :columns="columns"
      :data="data"
      :loading="loading"
      :pagination="pagination"
      :style="{ height: `100%` }"
      flex-height
      :row-key="(row: RowData) => row.key"
    />
    <AppendDialog :show="showAppendDialog" :data="editData" @close="handleAppendClose" />
    <DictValuesModal
      :show="showDictValuesModal"
      :dict-key="currentDictKey"
      :data="editingDictValues"
      @close="handleDictValuesModalClose"
    />
  </SearchTablePageLayout>
</template>
