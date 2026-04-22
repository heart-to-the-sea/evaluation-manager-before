<script setup lang="tsx">
import { computed, onMounted, reactive, ref } from 'vue';
import { AddCircle } from '@vicons/ionicons5';
import { NButton, NDataTable, NGrid, NGi, NIcon, NSpace, NSelect } from 'naive-ui';
import type { DataTableColumns, SelectOption } from 'naive-ui';
import DictSelect from '@/components/common/DictSelect.vue';
import DictTag from '@/components/common/DictTag.vue';
import PaperCreateDialog from '@/components/features/intern-assessment/PaperCreateDialog.vue';
import SearchTablePageLayout from '@/components/pages/SearchTablePageLayout.vue';
import { useTableSorter } from '@/composables/use-table-sorter';
import { fetchAssessmentPaperList, fetchAssessmentPaperRegenerate, fetchAssessmentPathList, fetchUserOptions } from '@/service/api';
import type { AssessmentPaperVo, UserOptionVo } from '@/types/app';
import { getAssessmentPassResultLabel, resolveAssessmentPassResult } from '@/utils/assessment-dict';

definePageMeta({
  title: '阶段考核'
});

interface RowData extends AssessmentPaperVo {
  key: string;
}

const searchParams = ref({
  userId: null as string | null,
  pathId: null as string | null,
  status: null as string | null
});

const loading = ref(false);
const tableData = ref<RowData[]>([]);
const showCreateDialog = ref(false);
const regenerateId = ref('');
const userOptions = ref<UserOptionVo[]>([]);
const pathOptions = ref<SelectOption[]>([]);
const { handleSorter, getSortOrder, appendSorter, createSorter, createSorterRender } = useTableSorter(() => loadData());
const sortableColumnKeys = new Set(['userName', 'stageName', 'status', 'questionTotal', 'correctTotal', 'score', 'passFlag', 'reviewedAt', 'createdAt']);

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

const userSelectOptions = computed<SelectOption[]>(() =>
  userOptions.value.map(item => ({
    label: `${item.name || '-'}${item.employeeNo ? `（${item.employeeNo}）` : ''}`,
    value: item.id || ''
  }))
);

const columns = computed<DataTableColumns<RowData>>(() =>
  ([
  {
    title: '#',
    key: 'index',
    width: 70,
    align: 'center',
    render: (_, index) => String((pagination.page - 1) * pagination.pageSize + index + 1)
  },
  { title: '实习生', key: 'userName', width: 140, fixed: 'left', render: row => row.userName || '-' },
  { title: '培训阶段', key: 'stageName', width: 160, render: row => row.stageName || '-' },
  {
    title: '试卷状态',
    key: 'status',
    width: 120,
    align: 'center',
    render: row => <DictTag dictCode="assessment_paper_status" value={row.status} />
  },
  { title: '题目数', key: 'questionTotal', width: 90, align: 'center', render: row => String(row.questionTotal ?? 0) },
  { title: '正确数', key: 'correctTotal', width: 90, align: 'center', render: row => String(row.correctTotal ?? 0) },
  { title: '得分', key: 'score', width: 90, align: 'center', render: row => String(row.score ?? '-') },
  {
    title: '通过',
    key: 'passFlag',
    width: 90,
    align: 'center',
    render: row => (
      <DictTag
        dictCode="assessment_pass_result"
        value={resolveAssessmentPassResult(row.status, row.passFlag)}
        fallbackLabel={getAssessmentPassResultLabel(row.status, row.passFlag)}
      />
    )
  },
  { title: '批阅时间', key: 'reviewedAt', width: 180, render: row => row.reviewedAt || '-' },
  { title: '创建时间', key: 'createdAt', width: 180 },
  {
    title: '操作',
    key: 'actions',
    width: 240,
    fixed: 'right',
    align: 'center',
    render: row => (
      <div class="em-table-actions">
        <NButton size="small" quaternary type="primary" onClick={() => navigateTo(`/intern-assessment/paper/info/${row.id}`)}>
          {row.status === 'reviewed' ? '查看考核' : '阅卷'}
        </NButton>
        <NButton
          size="small"
          quaternary
          type="warning"
          loading={regenerateId.value === row.id}
          onClick={() => handleRegenerate(row)}
        >
          重新生成
        </NButton>
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

onMounted(async () => {
  await loadUsers();
  await loadPathOptions();
  await loadData();
});

async function loadUsers() {
  const { data, error } = await fetchUserOptions({ userType: 'intern' });
  if (error) {
    userOptions.value = [];
    return;
  }
  userOptions.value = data || [];
}

async function loadPathOptions() {
  const { data, error } = await fetchAssessmentPathList({
    pageNum: 1,
    pageSize: 500
  });

  if (error) {
    pathOptions.value = [];
    return;
  }

  pathOptions.value = (data?.records || []).map(item => ({
    label: `${item.userName || '-'} / ${item.templateName || '-'} / ${item.currentStageName || '未开始培训'}`,
    value: item.id || ''
  }));
}

async function loadData() {
  loading.value = true;
  try {
    const { data, error } = await fetchAssessmentPaperList(appendSorter({
      pageNum: pagination.page,
      pageSize: pagination.pageSize,
      userId: searchParams.value.userId || undefined,
      pathId: searchParams.value.pathId || undefined,
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

function handleSearch() {
  pagination.page = 1;
  loadData();
}

function handleReset() {
  searchParams.value = {
    userId: null,
    pathId: null,
    status: null
  };
  pagination.page = 1;
  loadData();
}

async function handleCreateClose(submitted = false, paperId?: string) {
  showCreateDialog.value = false;
  if (submitted) {
    await loadPathOptions();
    await loadData();
    if (paperId) {
      await navigateTo(`/intern-assessment/paper/info/${paperId}`);
    }
  }
}

function handleRegenerate(row: RowData) {
  if (!row.id) {
    return;
  }

  window.$dialog?.warning({
    title: '重新生成考卷',
    content: `确认按当前阶段规则重新生成“${row.stageName || '当前阶段'}”的考卷吗？`,
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: async () => {
      regenerateId.value = row.id || '';
      try {
        const { data, error } = await fetchAssessmentPaperRegenerate({ paperId: row.id });
        if (error) {
          return;
        }

        window.$message?.success('阶段考核试卷已重新生成');
        await loadData();
        if (data) {
          await navigateTo(`/intern-assessment/paper/info/${data}`);
        }
      } finally {
        regenerateId.value = '';
      }
    }
  });
}
</script>

<template>
  <SearchTablePageLayout :pagination="pagination" @refresh="loadData">
    <template #searchBox>
      <NGrid :cols="12">
        <NGi span="12">
          <NSpace justify="end">
            <NSelect v-model:value="searchParams.userId" :options="userSelectOptions" clearable filterable placeholder="实习生" style="width: 220px" />
            <NSelect v-model:value="searchParams.pathId" :options="pathOptions" clearable placeholder="培训计划" style="width: 280px" />
            <DictSelect v-model:model-value="searchParams.status" dict-code="assessment_paper_status" clearable placeholder="试卷状态" style="width: 140px" />
            <NButton type="primary" @click="handleSearch">查询</NButton>
            <NButton @click="handleReset">重置</NButton>
          </NSpace>
        </NGi>
      </NGrid>
    </template>

    <template #h-btns>
      <NButton type="primary" @click="showCreateDialog = true">
        <NIcon class="mr-6px" size="18"><AddCircle /></NIcon>
        发起阶段考核
      </NButton>
    </template>

    <NDataTable
      :bordered="false"
      :single-line="false"
      :columns="columns"
      :data="tableData"
      :loading="loading"
      :pagination="pagination"
      :row-key="row => row.key"
      remote
      flex-height
      :style="{ height: '100%' }"
      @update:sorter="handleSorter"
    />

    <PaperCreateDialog :show="showCreateDialog" :user-options="userOptions" @close="handleCreateClose" />
  </SearchTablePageLayout>
</template>
