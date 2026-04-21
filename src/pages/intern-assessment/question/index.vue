<script setup lang="tsx">
import { computed, onMounted, reactive, ref } from 'vue';
import { AddCircle, ChevronDownOutline } from '@vicons/ionicons5';
import { NButton, NDataTable, NDropdown, NGrid, NGi, NIcon, NInput, NPopconfirm, NSpace, NSelect, NTag } from 'naive-ui';
import type { DataTableColumns, DataTableRowKey, DropdownOption, SelectOption } from 'naive-ui';
import DictSelect from '@/components/common/DictSelect.vue';
import DictTag from '@/components/common/DictTag.vue';
import QuestionDialog from '@/components/features/intern-assessment/QuestionDialog.vue';
import SearchTablePageLayout from '@/components/pages/SearchTablePageLayout.vue';
import { useTableSorter } from '@/composables/use-table-sorter';
import { fetchAssessmentQuestionBatchDelete, fetchAssessmentQuestionDelete, fetchAssessmentQuestionList, fetchAssessmentQuestionTemplateDownload, fetchAssessmentStageList } from '@/service/api';
import type { AssessmentQuestionVo } from '@/types/app';

definePageMeta({
  title: '题库管理'
});

interface RowData extends AssessmentQuestionVo {
  key: string;
}

const searchParams = ref({
  stageId: null as string | null,
  questionType: null as string | null,
  difficulty: null as string | null,
  stem: '',
  status: null as string | null,
  used: null as boolean | null
});

const loading = ref(false);
const tableData = ref<RowData[]>([]);
const showDialog = ref(false);
const editData = ref<AssessmentQuestionVo | null>(null);
const stageOptions = ref<SelectOption[]>([]);
const checkedRowKeys = ref<DataTableRowKey[]>([]);
const fileInputRef = ref<HTMLInputElement | null>(null);
const taskStore = useAssessmentTaskStore();
const { handleSorter, getSortOrder, appendSorter, createSorter, createSorterRender } = useTableSorter(() => loadData(), {
  fieldMap: {
    stageName: 'stageId'
  }
});
const sortableColumnKeys = new Set(['stageId', 'questionType', 'difficulty', 'knowledgePoint', 'stem', 'score', 'status', 'updatedAt']);

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
    type: 'selection',
    fixed: 'left'
  },
  {
    title: '#',
    key: 'index',
    width: 70,
    align: 'center',
    render: (_, index) => String((pagination.page - 1) * pagination.pageSize + index + 1)
  },
  { title: '所属阶段', key: 'stageName', width: 140, render: row => row.stageName || '-' },
  {
    title: '题型',
    key: 'questionType',
    width: 110,
    align: 'center',
    render: row => <DictTag dictCode="assessment_question_type" value={row.questionType} />
  },
  {
    title: '难度',
    key: 'difficulty',
    width: 110,
    align: 'center',
    render: row => <DictTag dictCode="assessment_question_difficulty" value={row.difficulty} />
  },
  { title: '知识点', key: 'knowledgePoint', width: 160, render: row => row.knowledgePoint || '-' },
  { title: '题干', key: 'stem', minWidth: 320, render: row => row.stem || '-' },
  { title: '分值', key: 'score', width: 90, align: 'center', render: row => String(row.score ?? 0) },
  {
    title: '状态',
    key: 'status',
    width: 90,
    align: 'center',
    render: row => <DictTag dictCode="assessment_enable_status" value={row.status} />
  },
  {
    title: '使用情况',
    key: 'used',
    width: 100,
    align: 'center',
    render: row => <NTag bordered={false} type={row.used ? 'warning' : 'success'}>{row.used ? '已使用' : '未使用'}</NTag>
  },
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
        {row.used
          ? (
            <NButton size="small" quaternary type="error" disabled>
              删除
            </NButton>
          )
          : (
            <NPopconfirm onPositiveClick={() => handleDelete(row)}>
              {{
                trigger: () => (
                  <NButton size="small" quaternary type="error">
                    删除
                  </NButton>
                ),
                default: () => '确认删除该题目吗？'
              }}
            </NPopconfirm>
          )}
      </div>
    )
  }
] as DataTableColumns<RowData>).map(column => {
    const columnKey = typeof column.key === 'string' ? column.key : '';
    const mappedColumnKey = columnKey === 'stageName' ? 'stageId' : columnKey;
    if (!sortableColumnKeys.has(mappedColumnKey)) {
      return column;
    }
    return {
      ...column,
      key: columnKey,
      sorter: createSorter(),
      sortOrder: getSortOrder(mappedColumnKey),
      renderSorter: createSorterRender(mappedColumnKey)
    };
  })
);

const moreOptions = computed<DropdownOption[]>(() => [
  { label: '导入题库', key: 'import' },
  { label: '导出题库', key: 'export-all' },
  { label: `导出所选${checkedRowKeys.value.length ? `（${checkedRowKeys.value.length}）` : ''}`, key: 'export-selected', disabled: !checkedRowKeys.value.length },
  { label: `删除所选${checkedRowKeys.value.length ? `（${checkedRowKeys.value.length}）` : ''}`, key: 'delete-selected', disabled: !checkedRowKeys.value.length },
  { label: '下载空白模板', key: 'download-template' }
]);

const usedOptions = [
  { label: '已使用', value: true },
  { label: '未使用', value: false }
];

onMounted(async () => {
  await loadStageOptions();
  await loadData();
});

async function loadStageOptions() {
  const { data, error } = await fetchAssessmentStageList({ pageNum: 1, pageSize: 500 });
  if (error) {
    stageOptions.value = [];
    return;
  }
  stageOptions.value = (data?.records || []).map(item => ({
    label: `${item.name || '-'}（${item.code || '-'}）`,
    value: item.id || ''
  }));
}

async function loadData() {
  loading.value = true;
  try {
    const { data, error } = await fetchAssessmentQuestionList(appendSorter({
      pageNum: pagination.page,
      pageSize: pagination.pageSize,
      stageId: searchParams.value.stageId || undefined,
      questionType: searchParams.value.questionType || undefined,
      difficulty: searchParams.value.difficulty || undefined,
      stem: searchParams.value.stem || undefined,
      status: searchParams.value.status || undefined,
      used: searchParams.value.used ?? undefined
    }));

    if (error) {
      return;
    }

    tableData.value = (data?.records || []).map((item, index) => ({
      ...item,
      key: item.id || `${index}`
    }));
    checkedRowKeys.value = [];
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
    stageId: null,
    questionType: null,
    difficulty: null,
    stem: '',
    status: null,
    used: null
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
  const { error } = await fetchAssessmentQuestionDelete(row.id);
  if (error) {
    return;
  }

  window.$message?.success('题目删除成功');
  await loadData();
}

function handleBatchDelete() {
  const ids = checkedRowKeys.value.map(item => String(item)).filter(Boolean);
  if (!ids.length) {
    window.$message?.warning('请先选择需要删除的题目');
    return;
  }
  const selectedData = tableData.value.filter(item => item.id && ids.includes(item.id));
  if (selectedData.some(item => item.used)) {
    window.$message?.warning('所选题目中包含已被使用的题目，无法删除');
    return;
  }

  window.$dialog?.warning({
    title: '批量删除',
    content: `确认删除所选 ${ids.length} 道题目吗？删除后无法恢复。`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      const { error } = await fetchAssessmentQuestionBatchDelete(ids);
      if (error) {
        return;
      }
      window.$message?.success('题目删除成功');
      await loadData();
    }
  });
}

async function handleDialogClose(submitted = false) {
  showDialog.value = false;
  editData.value = null;

  if (submitted) {
    await loadStageOptions();
    await loadData();
  }
}

async function submitImportFile(file: File) {
  if (!(file instanceof File)) {
    return;
  }
  const result = await taskStore.submitQuestionImport(file);
  if (result) {
    await loadData();
  }
}

async function handleExport() {
  await taskStore.submitQuestionExport({
    stageId: searchParams.value.stageId || undefined,
    questionType: searchParams.value.questionType || undefined,
    difficulty: searchParams.value.difficulty || undefined,
    stem: searchParams.value.stem || undefined,
    status: searchParams.value.status || undefined,
    used: searchParams.value.used ?? undefined
  });
}

async function handleExportSelected() {
  const ids = checkedRowKeys.value.map(item => String(item)).filter(Boolean);
  if (!ids.length) {
    window.$message?.warning('请先选择需要导出的题目');
    return;
  }
  await taskStore.submitQuestionExport({ ids });
}

function handleCheckedRowKeysChange(value: DataTableRowKey[]) {
  checkedRowKeys.value = value;
}

async function handleMoreSelect(key: string) {
  if (key === 'import') {
    fileInputRef.value?.click();
    return;
  }
  if (key === 'export-all') {
    await handleExport();
    return;
  }
  if (key === 'export-selected') {
    await handleExportSelected();
    return;
  }
  if (key === 'delete-selected') {
    handleBatchDelete();
    return;
  }
  if (key === 'download-template') {
    await fetchAssessmentQuestionTemplateDownload();
  }
}

async function handleFileInputChange(event: Event) {
  const target = event.target as HTMLInputElement | null;
  const file = target?.files?.[0];
  if (file) {
    await submitImportFile(file);
  }
  if (target) {
    target.value = '';
  }
}
</script>

<template>
  <SearchTablePageLayout :pagination="pagination" @refresh="loadData">
    <template #searchBox>
      <NGrid :cols="12">
        <NGi span="12">
          <NSpace justify="end">
            <NSelect v-model:value="searchParams.stageId" :options="stageOptions" clearable placeholder="所属阶段"
              style="width: 200px" />
            <DictSelect v-model:model-value="searchParams.questionType" dict-code="assessment_question_type" clearable
              placeholder="题型" style="width: 140px" />
            <DictSelect v-model:model-value="searchParams.difficulty" dict-code="assessment_question_difficulty"
              clearable placeholder="难度" style="width: 140px" />
            <DictSelect v-model:model-value="searchParams.status" dict-code="assessment_enable_status" clearable
              placeholder="状态" style="width: 140px" />
            <NSelect v-model:value="searchParams.used" :options="usedOptions" clearable placeholder="使用情况"
              style="width: 140px" />
            <NInput v-model:value="searchParams.stem" clearable placeholder="请输入题干关键词" style="width: 220px"
              @keyup.enter="handleSearch" />
            <NButton type="primary" @click="handleSearch">查询</NButton>
            <NButton @click="handleReset">重置</NButton>
          </NSpace>
        </NGi>
      </NGrid>
    </template>

    <template #h-btns>
      <input ref="fileInputRef" type="file" accept=".xls,.xlsx" style="display: none" @change="handleFileInputChange" />
      <NButton type="primary" @click="handleAdd">
        <NIcon class="mr-6px" size="18">
          <AddCircle />
        </NIcon>
        新增题目
      </NButton>
      <NDropdown :options="moreOptions" @select="handleMoreSelect">
        <NButton>
          更多
          <template #icon>
            <NIcon><ChevronDownOutline /></NIcon>
          </template>
        </NButton>
      </NDropdown>
    </template>

    <NDataTable :bordered="false" :single-line="false" :columns="columns" :data="tableData" :loading="loading"
      :pagination="pagination" :row-key="row => row.key" :checked-row-keys="checkedRowKeys" remote
      @update:checked-row-keys="handleCheckedRowKeysChange" @update:sorter="handleSorter" flex-height :style="{ height: '100%' }" />

    <QuestionDialog :show="showDialog" :data="editData" :stage-options="stageOptions" @close="handleDialogClose" />
  </SearchTablePageLayout>
</template>
