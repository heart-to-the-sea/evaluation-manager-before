<script setup lang="tsx">
import { computed, h, onMounted, reactive, ref } from 'vue';
import { AddCircle } from '@vicons/ionicons5';
import { NButton, NDataTable, NGrid, NGi, NIcon, NInput, NPopconfirm, NSpace } from 'naive-ui';
import type { DataTableColumns, SelectOption } from 'naive-ui';
import DictSelect from '@/components/common/DictSelect.vue';
import DictTag from '@/components/common/DictTag.vue';
import QuestionDialog from '@/components/features/intern-assessment/QuestionDialog.vue';
import SearchTablePageLayout from '@/components/pages/SearchTablePageLayout.vue';
import { fetchAssessmentQuestionDelete, fetchAssessmentQuestionList, fetchAssessmentStageList } from '@/service/api';
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
  status: null as string | null
});

const loading = ref(false);
const tableData = ref<RowData[]>([]);
const showDialog = ref(false);
const editData = ref<AssessmentQuestionVo | null>(null);
const stageOptions = ref<SelectOption[]>([]);

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

const columns = computed<DataTableColumns<RowData>>(() => [
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
            default: () => '确认删除该题目吗？'
          }}
        </NPopconfirm>
      </div>
    )
  }
]);

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
    const { data, error } = await fetchAssessmentQuestionList({
      pageNum: pagination.page,
      pageSize: pagination.pageSize,
      stageId: searchParams.value.stageId || undefined,
      questionType: searchParams.value.questionType || undefined,
      difficulty: searchParams.value.difficulty || undefined,
      stem: searchParams.value.stem || undefined,
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
    stageId: null,
    questionType: null,
    difficulty: null,
    stem: '',
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

async function handleDialogClose(submitted = false) {
  showDialog.value = false;
  editData.value = null;

  if (submitted) {
    await loadStageOptions();
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
            <NSelect v-model:value="searchParams.stageId" :options="stageOptions" clearable placeholder="所属阶段" style="width: 200px" />
            <DictSelect v-model:model-value="searchParams.questionType" dict-code="assessment_question_type" clearable placeholder="题型" style="width: 140px" />
            <DictSelect v-model:model-value="searchParams.difficulty" dict-code="assessment_question_difficulty" clearable placeholder="难度" style="width: 140px" />
            <DictSelect v-model:model-value="searchParams.status" dict-code="assessment_enable_status" clearable placeholder="状态" style="width: 140px" />
            <NInput v-model:value="searchParams.stem" clearable placeholder="请输入题干关键词" style="width: 220px" @keyup.enter="handleSearch" />
            <NButton type="primary" @click="handleSearch">查询</NButton>
            <NButton @click="handleReset">重置</NButton>
          </NSpace>
        </NGi>
      </NGrid>
    </template>

    <template #h-btns>
      <NButton type="primary" @click="handleAdd">
        <NIcon class="mr-6px" size="18"><AddCircle /></NIcon>
        新增题目
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

    <QuestionDialog :show="showDialog" :data="editData" :stage-options="stageOptions" @close="handleDialogClose" />
  </SearchTablePageLayout>
</template>
