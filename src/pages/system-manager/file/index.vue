<script setup lang="tsx">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { CloudUploadOutline } from '@vicons/ionicons5';
import {
  NButton,
  NDataTable,
  NForm,
  NFormItem,
  NGrid,
  NGi,
  NIcon,
  NInput,
  NModal,
  NPopconfirm,
  NSelect,
  NSpace,
  NUpload
} from 'naive-ui';
import type { DataTableColumns, PaginationProps, UploadCustomRequestOptions } from 'naive-ui';
import DictSelect from '@/components/common/DictSelect.vue';
import DictTag from '@/components/common/DictTag.vue';
import SearchTablePageLayout from '@/components/pages/SearchTablePageLayout.vue';
import { STORAGE_DICT_CODES } from '@/constants/storage';
import { useTableSorter } from '@/composables/use-table-sorter';
import {
  fetchFileRecordDelete,
  fetchFileRecordDownload,
  fetchFileRecordList,
  fetchFileRecordUpload,
  fetchStorageConfigOptions
} from '@/service/api';
import type { FileRecordBo, FileRecordVo, StorageConfigVo } from '@/types/app';

definePageMeta({
  title: '文件管理'
});

interface FileRow extends FileRecordVo {
  key: string;
}

const loading = ref(false);
const tableData = ref<FileRow[]>([]);
const uploadVisible = ref(false);
const uploading = ref(false);
const storageConfigs = ref<StorageConfigVo[]>([]);

const searchParams = ref({
  fileName: '',
  storageGroup: '' as string,
  storageType: '' as string,
  uploader: ''
});

const uploadForm = ref({
  storageGroup: '',
  storageConfigId: '',
  remark: ''
});

const { handleSorter, getSortOrder, appendSorter, createSorter, createSorterRender } = useTableSorter(() => loadData());
const sortableColumnKeys = new Set(['fileName', 'storageGroup', 'storageType', 'storageName', 'fileSize', 'createdAt']);

const pagination = reactive({
  page: 1,
  pageSize: 20,
  pageSizes: [20, 50, 100],
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

const columns = computed<DataTableColumns<FileRow>>(() => {
  const baseColumns: DataTableColumns<FileRow> = [
    {
      title: '文件名',
      key: 'fileName',
      minWidth: 220,
      render: row => row.fileName || '-'
    },
    {
      title: '用途分组',
      key: 'storageGroup',
      width: 180,
      render: row => <DictTag dictCode={STORAGE_DICT_CODES.group} value={row.storageGroup} fallbackLabel={row.storageGroup || '-'} />
    },
    {
      title: '存储类型',
      key: 'storageType',
      width: 140,
      render: row => <DictTag dictCode={STORAGE_DICT_CODES.type} value={row.storageType || null} fallbackLabel={row.storageTypeLabel || row.storageType || '-'} />
    },
    {
      title: '存储配置',
      key: 'storageName',
      minWidth: 180,
      render: row => row.storageName || '-'
    },
    {
      title: '文件路径',
      key: 'filePath',
      minWidth: 280,
      render: row => row.filePath || '-'
    },
    {
      title: '大小',
      key: 'fileSize',
      width: 120,
      align: 'center',
      render: row => formatFileSize(row.fileSize)
    },
    {
      title: '上传人',
      key: 'uploaderName',
      width: 140,
      render: row => row.uploaderName || '-'
    },
    {
      title: '上传时间',
      key: 'createdAt',
      width: 180,
      render: row => row.createdAt || '-'
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      fixed: 'right',
      align: 'center',
      render: row => (
        <div class="em-table-actions">
          <NButton size="small" quaternary type="primary" onClick={() => handleDownload(row)}>
            下载
          </NButton>
          <NPopconfirm onPositiveClick={() => handleDelete(row)}>
            {{
              trigger: () => (
                <NButton size="small" quaternary type="error">
                  删除
                </NButton>
              ),
              default: () => '确认删除该文件吗？'
            }}
          </NPopconfirm>
        </div>
      )
    }
  ];

  return baseColumns.map(column => {
    const columnKey = typeof (column as { key?: unknown }).key === 'string' ? String((column as { key?: unknown }).key) : '';
    if (!sortableColumnKeys.has(columnKey)) {
      return column as DataTableColumns<FileRow>[number];
    }

    return {
      ...(column as DataTableColumns<FileRow>[number]),
      sorter: createSorter(),
      sortOrder: getSortOrder(columnKey),
      renderSorter: createSorterRender(columnKey)
    } as DataTableColumns<FileRow>[number];
  }) as DataTableColumns<FileRow>;
});

const storageConfigOptions = computed(() =>
  storageConfigs.value
    .filter(item => item.id)
    .map(item => ({
      label: `${item.name || '-'} · ${item.storageTypeLabel || item.storageType || '-'}`,
      value: item.id as string
    }))
);

watch(
  () => uploadVisible.value,
  visible => {
    if (!visible) {
      return;
    }

    uploadForm.value = {
      storageGroup: searchParams.value.storageGroup || '',
      storageConfigId: '',
      remark: ''
    };
    loadStorageConfigs();
  }
);

watch(
  () => uploadForm.value.storageGroup,
  () => {
    uploadForm.value.storageConfigId = '';
    loadStorageConfigs();
  }
);

onMounted(() => {
  loadData();
});

function handleSearch() {
  pagination.page = 1;
  loadData();
}

function handleReset() {
  searchParams.value = {
    fileName: '',
    storageGroup: '',
    storageType: '',
    uploader: ''
  };
  pagination.page = 1;
  loadData();
}

function handleOpenUpload() {
  uploadVisible.value = true;
}

function handleCloseUpload() {
  uploadVisible.value = false;
  uploadForm.value = {
    storageGroup: '',
    storageConfigId: '',
    remark: ''
  };
  storageConfigs.value = [];
}

async function loadStorageConfigs() {
  if (!uploadVisible.value) {
    return;
  }

  const { data, error } = await fetchStorageConfigOptions(uploadForm.value.storageGroup || undefined);
  if (error) {
    return;
  }

  storageConfigs.value = data || [];
  if (!uploadForm.value.storageConfigId) {
    const defaultConfig = storageConfigs.value.find(item => item.defaultFlag) || storageConfigs.value[0];
    uploadForm.value.storageConfigId = defaultConfig?.id || '';
  }
}

async function loadData() {
  loading.value = true;

  try {
    const { data, error } = await fetchFileRecordList(
      appendSorter({
        pageNum: pagination.page,
        pageSize: pagination.pageSize,
        fileName: searchParams.value.fileName || undefined,
        storageGroup: searchParams.value.storageGroup || undefined,
        storageType: searchParams.value.storageType || undefined,
        uploaderName: searchParams.value.uploader || undefined
      } as FileRecordBo)
    );

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

async function handleUploadRequest(options: UploadCustomRequestOptions) {
  const file = options.file.file;
  if (!(file instanceof File)) {
    options.onError?.();
    return;
  }

  if (!uploadForm.value.storageGroup) {
    window.$message?.error('请选择用途分组');
    options.onError?.();
    return;
  }

  if (!uploadForm.value.storageConfigId) {
    window.$message?.error('请选择存储配置');
    options.onError?.();
    return;
  }

  uploading.value = true;

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('storageGroup', uploadForm.value.storageGroup);
    formData.append('storageConfigId', uploadForm.value.storageConfigId);
    if (uploadForm.value.remark) {
      formData.append('remark', uploadForm.value.remark);
    }

    const { error, msg } = await fetchFileRecordUpload(formData);
    if (error) {
      options.onError?.();
      return;
    }

    window.$message?.success(msg || '文件上传成功');
    options.onFinish?.();
    handleCloseUpload();
    await loadData();
  } finally {
    uploading.value = false;
  }
}

async function handleDelete(row: FileRow) {
  if (!row.id) {
    return;
  }

  const { error } = await fetchFileRecordDelete(row.id);
  if (error) {
    return;
  }

  window.$message?.success('文件删除成功');
  await loadData();
}

async function handleDownload(row: FileRow) {
  if (!row.id) {
    return;
  }

  await fetchFileRecordDownload(row.id, row.fileName);
}

function formatFileSize(size?: number | null) {
  if (size === null || size === undefined) {
    return '-';
  }

  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  if (size < 1024 * 1024 * 1024) {
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  }
  return `${(size / 1024 / 1024 / 1024).toFixed(1)} GB`;
}
</script>

<template>
  <SearchTablePageLayout :pagination="pagination" @refresh="loadData">
    <template #searchBox>
      <NGrid :cols="12">
        <NGi span="12">
          <NSpace justify="end" wrap>
            <NInput v-model:value="searchParams.fileName" clearable placeholder="文件名" style="width: 180px" @keyup.enter="handleSearch" />
            <DictSelect
              v-model:model-value="searchParams.storageGroup"
              :dict-code="STORAGE_DICT_CODES.group"
              clearable
              placeholder="用途分组"
              style="width: 160px"
            />
            <DictSelect
              v-model:model-value="searchParams.storageType"
              :dict-code="STORAGE_DICT_CODES.type"
              clearable
              placeholder="存储类型"
              style="width: 160px"
            />
            <NInput v-model:value="searchParams.uploader" clearable placeholder="上传人" style="width: 160px" />
            <NButton type="primary" @click="handleSearch">查询</NButton>
            <NButton @click="handleReset">重置</NButton>
          </NSpace>
        </NGi>
      </NGrid>
    </template>

    <template #h-btns>
      <NButton type="primary" @click="handleOpenUpload">
        <NIcon class="mr-6px" size="18">
          <CloudUploadOutline />
        </NIcon>
        上传文件
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

    <NModal
      :show="uploadVisible"
      preset="card"
      title="上传文件"
      :style="{ width: '680px' }"
      :mask-closable="false"
      @update:show="value => !value && handleCloseUpload()"
    >
      <NForm label-placement="left" label-width="100">
        <NGrid :cols="2" :x-gap="16">
          <NGi>
            <NFormItem label="用途分组">
              <DictSelect
                v-model:model-value="uploadForm.storageGroup"
                :dict-code="STORAGE_DICT_CODES.group"
                placeholder="请选择用途分组"
                clearable
              />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="存储配置">
              <NSelect v-model:value="uploadForm.storageConfigId" :options="storageConfigOptions" placeholder="请选择存储配置" clearable />
            </NFormItem>
          </NGi>
        </NGrid>

        <NFormItem label="备注">
          <NInput v-model:value="uploadForm.remark" type="textarea" :rows="3" placeholder="可选" />
        </NFormItem>

        <NFormItem label="文件">
          <NUpload
            :show-file-list="false"
            :disabled="uploading || !uploadForm.storageGroup || !uploadForm.storageConfigId"
            :custom-request="handleUploadRequest"
          >
            <NButton :loading="uploading" type="primary">选择文件上传</NButton>
          </NUpload>
        </NFormItem>
      </NForm>
    </NModal>
  </SearchTablePageLayout>
</template>
