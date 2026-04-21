<script setup lang="tsx">
import { computed, onMounted, reactive, ref } from 'vue';
import { AddCircle } from '@vicons/ionicons5';
import { NButton, NDataTable, NGrid, NGi, NIcon, NInput, NPopconfirm, NSpace } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import DictSelect from '@/components/common/DictSelect.vue';
import DictTag from '@/components/common/DictTag.vue';
import SearchTablePageLayout from '@/components/pages/SearchTablePageLayout.vue';
import StageDialog from '@/components/features/intern-assessment/StageDialog.vue';
import { useTableSorter } from '@/composables/use-table-sorter';
import { fetchAssessmentStageDelete, fetchAssessmentStageList } from '@/service/api';
import type { AssessmentStageVo } from '@/types/app';

definePageMeta({
  title: '培训阶段'
});

interface RowData extends AssessmentStageVo {
  key: string;
}

const searchParams = ref({
  code: '',
  name: '',
  status: ''
});

const loading = ref(false);
const tableData = ref<RowData[]>([]);
const showDialog = ref(false);
const editData = ref<AssessmentStageVo | null>(null);
const { handleSorter, getSortOrder, appendSorter, createSorter, createSorterRender } = useTableSorter(() => loadData());
const sortableColumnKeys = new Set(['code', 'name', 'passScore', 'sort', 'status', 'description', 'updatedAt']);

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

const columns = computed<DataTableColumns<RowData>>(() =>
  ([
  {
    title: '#',
    key: 'index',
    width: 70,
    align: 'center',
    render: (_, index) => String((pagination.page - 1) * pagination.pageSize + index + 1)
  },
  { title: '阶段编码', key: 'code', width: 160 },
  { title: '阶段名称', key: 'name', minWidth: 160 },
  {
    title: '颜色',
    key: 'stageColor',
    width: 100,
    align: 'center',
    render: row => (
      <div class="stage-color-cell">
        <span class="stage-color-cell__dot" style={{ backgroundColor: row.stageColor || 'rgb(var(--em-primary-color-rgb) / 0.18)' }}></span>
      </div>
    )
  },
  {
    title: '学习时间',
    key: 'studyDays',
    width: 150,
    align: 'center',
    render: row => resolveStudyDaysText(row)
  },
  { title: '通过分数', key: 'passScore', width: 120, align: 'center', render: row => String(row.passScore ?? '-') },
  { title: '资料数', key: 'materialCount', width: 100, align: 'center', render: row => String(row.materials?.length || 0) },
  { title: '规则数', key: 'ruleCount', width: 100, align: 'center', render: row => String(row.rules?.length || 0) },
  { title: '排序', key: 'sort', width: 90, align: 'center', render: row => String(row.sort ?? 0) },
  {
    title: '状态',
    key: 'status',
    width: 90,
    align: 'center',
    render: row => <DictTag dictCode="assessment_enable_status" value={row.status} />
  },
  { title: '说明', key: 'description', minWidth: 220, render: row => row.description || '-' },
  { title: '更新时间', key: 'updatedAt', width: 180 },
  {
    title: '操作',
    key: 'actions',
    width: 180,
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
            default: () => '确认删除该阶段吗？'
          }}
        </NPopconfirm>
      </div>
    )
  }
] as DataTableColumns<RowData>).map(column => {
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

onMounted(() => {
  loadData();
});

async function loadData() {
  loading.value = true;

  try {
    const { data, error } = await fetchAssessmentStageList(appendSorter({
      pageNum: pagination.page,
      pageSize: pagination.pageSize,
      code: searchParams.value.code || undefined,
      name: searchParams.value.name || undefined,
      status: searchParams.value.status || undefined
    }));

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

function resolveStudyDaysText(row: RowData) {
  const min = row.minStudyDays;
  const max = row.maxStudyDays;
  if (min == null && max == null) return '未配置';
  if (min != null && max != null) return `${min}-${max}天`;
  if (min != null) return `不少于${min}天`;
  return `不超过${max}天`;
}

function handleSearch() {
  pagination.page = 1;
  loadData();
}

function handleReset() {
  searchParams.value = {
    code: '',
    name: '',
    status: ''
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

async function handleDelete(row: RowData) {
  if (!row.id) {
    return;
  }

  const { error } = await fetchAssessmentStageDelete(row.id);
  if (error) {
    return;
  }

  window.$message?.success('阶段删除成功');
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
            <NInput v-model:value="searchParams.code" clearable placeholder="请输入阶段编码" style="width: 180px" @keyup.enter="handleSearch" />
            <NInput v-model:value="searchParams.name" clearable placeholder="请输入阶段名称" style="width: 180px" @keyup.enter="handleSearch" />
            <DictSelect v-model:model-value="searchParams.status" dict-code="assessment_enable_status" clearable placeholder="状态" style="width: 140px" />
            <NButton type="primary" @click="handleSearch">查询</NButton>
            <NButton @click="handleReset">重置</NButton>
          </NSpace>
        </NGi>
      </NGrid>
    </template>

    <template #h-btns>
      <NButton type="primary" @click="handleAdd">
        <NIcon class="mr-6px" size="18"><AddCircle /></NIcon>
        新增阶段
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
      @update:sorter="handleSorter"
      flex-height
      :style="{ height: '100%' }"
    />

    <StageDialog :show="showDialog" :data="editData" @close="handleDialogClose" />
  </SearchTablePageLayout>
</template>

<style scoped lang="scss">
.stage-color-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

.stage-color-cell__dot {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  box-shadow:
    inset 0 0 0 1px rgb(var(--border-color)),
    0 0 0 4px rgb(var(--em-primary-color-rgb) / 0.08);
}
</style>
