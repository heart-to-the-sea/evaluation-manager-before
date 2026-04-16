<script setup lang="tsx">
import { computed, h, onMounted, reactive, ref } from 'vue';
import { AddCircle } from '@vicons/ionicons5';
import { NButton, NDataTable, NGrid, NGi, NIcon, NSpace, NSelect, NTag } from 'naive-ui';
import type { DataTableColumns, SelectOption } from 'naive-ui';
import DictSelect from '@/components/common/DictSelect.vue';
import PaperCreateDialog from '@/components/features/intern-assessment/PaperCreateDialog.vue';
import SearchTablePageLayout from '@/components/pages/SearchTablePageLayout.vue';
import { useDict } from '@/composables/use-dict';
import { fetchAssessmentPaperList, fetchAssessmentPathList, fetchUserOptions } from '@/service/api';
import type { AssessmentPaperVo, UserOptionVo } from '@/types/app';

definePageMeta({
  title: '考核记录'
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
const userOptions = ref<UserOptionVo[]>([]);
const pathOptions = ref<SelectOption[]>([]);

const paperStatusDict = useDict('assessment_paper_status');

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

const userSelectOptions = computed<SelectOption[]>(() =>
  userOptions.value.map(item => ({
    label: `${item.name || '-'}${item.employeeNo ? `（${item.employeeNo}）` : ''}`,
    value: item.id || ''
  }))
);

const columns = computed<DataTableColumns<RowData>>(() => [
  {
    title: '#',
    key: 'index',
    width: 70,
    align: 'center',
    render: (_, index) => String((pagination.page - 1) * pagination.pageSize + index + 1)
  },
  { title: '实习生', key: 'userName', width: 140, fixed: 'left', render: row => row.userName || '-' },
  { title: '考核阶段', key: 'stageName', width: 160, render: row => row.stageName || '-' },
  {
    title: '试卷状态',
    key: 'status',
    width: 120,
    align: 'center',
    render: row => h(NTag, { bordered: false, type: row.status === 'reviewed' ? 'success' : 'warning' }, { default: () => paperStatusDict.getLabel(row.status) || '-' })
  },
  { title: '题目数', key: 'questionTotal', width: 90, align: 'center', render: row => String(row.questionTotal ?? 0) },
  { title: '正确数', key: 'correctTotal', width: 90, align: 'center', render: row => String(row.correctTotal ?? 0) },
  { title: '得分', key: 'score', width: 90, align: 'center', render: row => String(row.score ?? '-') },
  {
    title: '通过',
    key: 'passFlag',
    width: 90,
    align: 'center',
    render: row => h(NTag, { bordered: false, type: row.passFlag ? 'success' : 'error' }, { default: () => (row.passFlag == null ? '-' : row.passFlag ? '通过' : '未通过') })
  },
  { title: '批阅时间', key: 'reviewedAt', width: 180, render: row => row.reviewedAt || '-' },
  { title: '创建时间', key: 'createdAt', width: 180 },
  {
    title: '操作',
    key: 'actions',
    width: 170,
    fixed: 'right',
    align: 'center',
    render: row => (
      <div class="em-table-actions">
        <NButton size="small" quaternary type="primary" onClick={() => navigateTo(`/intern-assessment/paper/info/${row.id}`)}>
          {row.status === 'reviewed' ? '查看' : '批阅'}
        </NButton>
      </div>
    )
  }
]);

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
    label: `${item.userName || '-'} / ${item.templateName || '-'} / ${item.currentStageName || '未开始'}`,
    value: item.id || ''
  }));
}

async function loadData() {
  loading.value = true;
  try {
    const { data, error } = await fetchAssessmentPaperList({
      pageNum: pagination.page,
      pageSize: pagination.pageSize,
      userId: searchParams.value.userId || undefined,
      pathId: searchParams.value.pathId || undefined,
      status: searchParams.value.status || undefined
    });
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

async function handleCreateClose(submitted = false) {
  showCreateDialog.value = false;
  if (submitted) {
    await loadPathOptions();
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
            <NSelect v-model:value="searchParams.userId" :options="userSelectOptions" clearable filterable placeholder="实习生" style="width: 220px" />
            <NSelect v-model:value="searchParams.pathId" :options="pathOptions" clearable placeholder="考核路径" style="width: 280px" />
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
        生成试卷
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
      flex-height
      :style="{ height: '100%' }"
    />

    <PaperCreateDialog :show="showCreateDialog" :user-options="userOptions" @close="handleCreateClose" />
  </SearchTablePageLayout>
</template>
