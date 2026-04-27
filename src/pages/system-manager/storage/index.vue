<script setup lang="tsx">
import { computed, onMounted, reactive, ref } from 'vue';
import { AddCircle } from '@vicons/ionicons5';
import { NButton, NDataTable, NGrid, NGi, NIcon, NInput, NPopconfirm, NSpace } from 'naive-ui';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import DictSelect from '@/components/common/DictSelect.vue';
import DictTag from '@/components/common/DictTag.vue';
import SearchTablePageLayout from '@/components/pages/SearchTablePageLayout.vue';
import StorageDialog from '@/components/features/storage/StorageDialog.vue';
import { STORAGE_DICT_CODES, joinStorageGroups, splitStorageGroups } from '@/constants/storage';
import { useTableSorter } from '@/composables/use-table-sorter';
import {
  fetchStorageConfigDelete,
  fetchStorageConfigList,
  fetchStorageConfigSetDefault,
  fetchStorageConfigTestConnection
} from '@/service/api';
import type { StorageConfigBo, StorageConfigVo } from '@/types/app';

definePageMeta({
  title: '存储管理'
});

interface RowData extends StorageConfigVo {
  key: string;
}

const loading = ref(false);
const tableData = ref<RowData[]>([]);
const showDialog = ref(false);
const editData = ref<StorageConfigVo | null>(null);
const { handleSorter, getSortOrder, appendSorter, createSorter, createSorterRender } = useTableSorter(() => loadData());
const sortableColumnKeys = new Set(['name', 'storageGroup', 'storageType', 'status', 'defaultFlag', 'updatedAt']);

const searchParams = ref({
  name: '',
  storageGroups: [] as string[],
  storageType: '' as string,
  status: null as string | null
});

const pagination = reactive({
  page: 1,
  pageSize: 20,
  pageSizes: [20, 50, 100, 200],
  showSizePicker: true,
  itemCount: 0,
  prefix: (info: Parameters<NonNullable<PaginationProps['prefix']>>[0]) => `共 ${info.itemCount || 0} 条`,
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

const baseColumns: DataTableColumns<RowData> = [
  {
    title: '#',
    key: 'index',
    width: 68,
    align: 'center',
    render: (_, index) => String((pagination.page - 1) * pagination.pageSize + index + 1)
  },
  {
    title: '存储名称',
    key: 'name',
    minWidth: 180,
    fixed: 'left',
    render: row => row.name || '-'
  },
  {
    title: '用途分组',
    key: 'storageGroup',
    minWidth: 220,
    render: row => renderStorageGroups(row.storageGroup)
  },
  {
    title: '类型',
    key: 'storageType',
    width: 150,
    render: row => (
      <DictTag
        dictCode={STORAGE_DICT_CODES.type}
        value={row.storageType || null}
        fallbackLabel={row.storageTypeLabel || row.storageType || '-'}
      />
    )
  },
  {
    title: '存储位置',
    key: 'endpoint',
    minWidth: 260,
    render: row => renderTarget(row)
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    align: 'center',
    render: row => (
      <DictTag
        dictCode={STORAGE_DICT_CODES.status}
        value={row.status ?? null}
        fallbackLabel={row.statusLabel || (row.status === 1 ? '启用' : '禁用')}
      />
    )
  },
  {
    title: '默认',
    key: 'defaultFlag',
    width: 100,
    align: 'center',
    render: row => (
      <DictTag
        dictCode={STORAGE_DICT_CODES.defaultFlag}
        value={row.defaultFlag ? '1' : '0'}
        fallbackLabel={row.defaultFlag ? '默认' : '普通'}
      />
    )
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
    width: 280,
    fixed: 'right',
    align: 'center',
    render: row => (
      <div class="em-table-actions">
        <NButton size="small" quaternary type="primary" onClick={() => handleTestConnection(row)}>
          测试
        </NButton>
        <NButton size="small" quaternary type="primary" disabled={row.defaultFlag} onClick={() => handleSetDefault(row)}>
          设默认
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
            default: () => '确认删除该存储配置吗？'
          }}
        </NPopconfirm>
      </div>
    )
  }
];

const columns = computed<DataTableColumns<RowData>>(() => {
  return baseColumns.map(column => {
    const columnKey = typeof (column as { key?: unknown }).key === 'string' ? String((column as { key?: unknown }).key) : '';
    if (!sortableColumnKeys.has(columnKey)) {
      return column as DataTableColumns<RowData>[number];
    }

    return {
      ...(column as DataTableColumns<RowData>[number]),
      sorter: createSorter(),
      sortOrder: getSortOrder(columnKey),
      renderSorter: createSorterRender(columnKey)
    } as DataTableColumns<RowData>[number];
  }) as DataTableColumns<RowData>;
});

onMounted(() => {
  loadData();
});

function renderStorageGroups(storageGroup?: string | null) {
  const groups = splitStorageGroups(storageGroup);
  if (!groups.length) {
    return '-';
  }

  return (
    <NSpace size={6} wrap>
      {groups.map(group => (
        <DictTag
          key={group}
          dictCode={STORAGE_DICT_CODES.group}
          value={group}
          fallbackLabel={group}
        />
      ))}
    </NSpace>
  );
}

function renderTarget(row: RowData) {
  if (row.storageType === 'LOCAL') {
    return row.basePath || '-';
  }

  const parts = [row.endpoint, row.bucketName].filter(Boolean);
  return parts.length ? parts.join(' / ') : '-';
}

async function loadData() {
  loading.value = true;

  try {
    const { data, error } = await fetchStorageConfigList(appendSorter({
      pageNum: pagination.page,
      pageSize: pagination.pageSize,
      name: searchParams.value.name || undefined,
      storageGroup: joinStorageGroups(searchParams.value.storageGroups) || undefined,
      storageType: searchParams.value.storageType || undefined,
      status: searchParams.value.status === null || searchParams.value.status === '' ? undefined : Number(searchParams.value.status)
    } as StorageConfigBo));

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
    storageGroups: [],
    storageType: '',
    status: null
  };
  pagination.page = 1;
  loadData();
}

function handleAdd() {
  editData.value = null;
  showDialog.value = true;
}

function handleEdit(row: RowData) {
  editData.value = { ...row };
  showDialog.value = true;
}

async function handleTestConnection(row: RowData) {
  if (!row.id) {
    return;
  }

  const { error, msg } = await fetchStorageConfigTestConnection({
    id: row.id,
    name: row.name,
    storageGroup: row.storageGroup,
    storageType: row.storageType,
    endpoint: row.endpoint,
    bucketName: row.bucketName,
    accessKey: row.accessKey,
    secretKey: row.secretKey,
    region: row.region,
    basePath: row.basePath,
    publicUrl: row.publicUrl,
    pathPrefix: row.pathPrefix,
    status: row.status,
    defaultFlag: row.defaultFlag,
    remark: row.remark
  });

  if (error) {
    return;
  }

  window.$message?.success(msg || '连接测试成功');
}

async function handleSetDefault(row: RowData) {
  if (!row.id) {
    return;
  }

  const { error } = await fetchStorageConfigSetDefault(row.id);
  if (error) {
    return;
  }

  window.$message?.success('默认存储已更新');
  await loadData();
}

async function handleDelete(row: RowData) {
  if (!row.id) {
    return;
  }

  const { error } = await fetchStorageConfigDelete(row.id);
  if (error) {
    return;
  }

  window.$message?.success('存储配置删除成功');
  await loadData();
}

function handleDialogClose(submitted = false) {
  showDialog.value = false;
  editData.value = null;

  if (submitted) {
    loadData();
  }
}
</script>

<template>
  <SearchTablePageLayout :pagination="pagination" @refresh="loadData">
    <template #searchBox>
      <NGrid :cols="12">
        <NGi span="12">
          <NSpace justify="end" wrap>
            <NInput v-model:value="searchParams.name" clearable placeholder="请输入存储名称" style="width: 180px" @keyup.enter="handleSearch" />
            <DictSelect
              v-model:model-value="searchParams.storageGroups"
              dict-code="storage_usage_group"
              multiple
              clearable
              filterable
              max-tag-count="responsive"
              placeholder="用途分组"
              style="width: 220px"
            />
            <DictSelect
              v-model:model-value="searchParams.storageType"
              dict-code="storage_type"
              clearable
              filterable
              placeholder="存储类型"
              style="width: 160px"
            />
            <DictSelect
              v-model:model-value="searchParams.status"
              dict-code="storage_status"
              clearable
              placeholder="状态"
              style="width: 140px"
            />
            <NButton type="primary" @click="handleSearch">查询</NButton>
            <NButton @click="handleReset">重置</NButton>
          </NSpace>
        </NGi>
      </NGrid>
    </template>

    <template #h-btns>
      <NButton type="primary" @click="handleAdd">
        <NIcon class="mr-6px" size="18"><AddCircle /></NIcon>
        新增存储
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
      flex-height
      :row-key="row => row.key"
      :style="{ height: '100%' }"
      @update:sorter="handleSorter"
    />

    <StorageDialog :show="showDialog" :data="editData" @close="handleDialogClose" />
  </SearchTablePageLayout>
</template>
