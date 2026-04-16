<script setup lang="tsx">
import { computed, onMounted, reactive, ref } from 'vue';
import { NButton, NDataTable, NGrid, NGi, NSpace, NSelect, NTag, NTooltip, useThemeVars } from 'naive-ui';
import type { DataTableColumns, SelectOption } from 'naive-ui';
import DictSelect from '@/components/common/DictSelect.vue';
import SearchTablePageLayout from '@/components/pages/SearchTablePageLayout.vue';
import { useDict } from '@/composables/use-dict';
import { fetchAssessmentPathList, fetchAssessmentTemplateList, fetchUserOptions } from '@/service/api';
import type { AssessmentInternPathStageVo, AssessmentInternPathVo, UserOptionVo } from '@/types/app';

const TEXT = {
  title: '实习生管理',
  user: '实习生',
  employeeNo: '工号',
  template: '路径模板',
  currentStage: '当前阶段',
  totalStatus: '整体状态',
  progress: '阶段进度',
  updatedAt: '更新时间',
  actions: '操作',
  viewDetail: '详情',
  searchUser: '请选择实习生',
  searchTemplate: '请选择路径模板',
  searchStatus: '请选择整体状态',
  search: '查询',
  reset: '重置',
  emptyProgress: '暂无阶段',
  stageName: '阶段名称',
  stageStatus: '阶段状态',
  result: '考核结果',
  score: '得分',
  correctTotal: '答对题数',
  examTime: '考核时间',
  reviewTime: '批阅时间',
  comment: '结果说明',
  pendingReview: '待批阅',
  passed: '已通过',
  failed: '未通过',
  inProgress: '进行中',
  skipped: '已跳过',
  notStarted: '未开始'
} as const;

definePageMeta({
  title: TEXT.title
});

interface RowData extends AssessmentInternPathVo {
  key: string;
}

const themeVars = useThemeVars();
const loading = ref(false);
const tableData = ref<RowData[]>([]);
const userOptions = ref<UserOptionVo[]>([]);
const templateOptions = ref<SelectOption[]>([]);

const searchParams = ref({
  userId: null as string | null,
  templateId: null as string | null,
  status: null as string | null
});

const statusDict = useDict('assessment_path_status');
const stageStatusDict = useDict('assessment_path_stage_status');

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
  {
    title: TEXT.user,
    key: 'userName',
    width: 160,
    fixed: 'left',
    render: row => row.userName || '-'
  },
  {
    title: TEXT.employeeNo,
    key: 'employeeNo',
    width: 130,
    render: row => row.employeeNo || '-'
  },
  {
    title: TEXT.template,
    key: 'templateName',
    minWidth: 180,
    render: row => row.templateName || '-'
  },
  {
    title: TEXT.currentStage,
    key: 'currentStageName',
    width: 150,
    render: row => row.currentStageName || '-'
  },
  {
    title: TEXT.totalStatus,
    key: 'status',
    width: 120,
    align: 'center',
    render: row => <NTag bordered={false} type={getPathTagType(row.status)}>{statusDict.getLabel(row.status) || '-'}</NTag>
  },
  {
    title: TEXT.progress,
    key: 'stages',
    minWidth: 420,
    render: row => renderStageProgress(row.stages || [])
  },
  {
    title: TEXT.updatedAt,
    key: 'updatedAt',
    width: 180,
    render: row => row.updatedAt || '-'
  },
  {
    title: TEXT.actions,
    key: 'actions',
    width: 120,
    fixed: 'right',
    align: 'center',
    render: row => (
      <div class="em-table-actions">
        <NButton size="small" quaternary type="primary" onClick={() => handleViewPath(row)}>
          {TEXT.viewDetail}
        </NButton>
      </div>
    )
  }
]);

onMounted(async () => {
  await Promise.all([loadUsers(), loadTemplateOptions()]);
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

async function loadTemplateOptions() {
  const { data, error } = await fetchAssessmentTemplateList({ pageNum: 1, pageSize: 500, status: '1' });
  if (error) {
    templateOptions.value = [];
    return;
  }
  templateOptions.value = (data?.records || []).map(item => ({
    label: item.name || '-',
    value: item.id || ''
  }));
}

async function loadData() {
  loading.value = true;
  try {
    const { data, error } = await fetchAssessmentPathList({
      pageNum: pagination.page,
      pageSize: pagination.pageSize,
      userId: searchParams.value.userId || undefined,
      templateId: searchParams.value.templateId || undefined,
      status: searchParams.value.status || undefined
    });
    if (error) return;
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
    templateId: null,
    status: null
  };
  pagination.page = 1;
  loadData();
}

function handleViewPath(row: RowData) {
  if (!row.id) return;
  navigateTo(`/intern-assessment/intern/info/${row.id}`);
}

function getPathTagType(status?: string): 'default' | 'success' | 'warning' {
  if (status === 'completed') return 'success';
  if (status === 'in_progress') return 'warning';
  return 'default';
}

function getStageVisual(status?: string) {
  const vars = themeVars.value;

  if (status === 'passed') {
    return {
      dotColor: vars.successColor,
      ringColor: 'rgb(82 196 26 / 18%)',
      borderColor: 'rgb(82 196 26 / 34%)',
      lineColor: 'rgb(82 196 26 / 56%)'
    };
  }

  if (status === 'in_progress' || status === 'pending_review') {
    return {
      dotColor: vars.warningColor,
      ringColor: 'rgb(250 173 20 / 18%)',
      borderColor: 'rgb(250 173 20 / 34%)',
      lineColor: 'rgb(250 173 20 / 44%)'
    };
  }

  if (status === 'failed') {
    return {
      dotColor: vars.errorColor,
      ringColor: 'rgb(245 34 45 / 18%)',
      borderColor: 'rgb(245 34 45 / 34%)',
      lineColor: 'rgb(245 34 45 / 44%)'
    };
  }

  if (status === 'skipped') {
    return {
      dotColor: vars.infoColor,
      ringColor: 'rgb(32 128 240 / 18%)',
      borderColor: 'rgb(32 128 240 / 34%)',
      lineColor: 'rgb(32 128 240 / 44%)'
    };
  }

  return {
    dotColor: 'rgb(var(--layout-bg-color))',
    ringColor: 'rgb(var(--border-color) / 18%)',
    borderColor: 'rgb(var(--border-color) / 80%)',
    lineColor: 'rgb(var(--border-color) / 84%)'
  };
}

function getStageDotStyle(status?: string) {
  const visual = getStageVisual(status);

  return {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    background: visual.dotColor,
    border: `1px solid ${visual.borderColor}`,
    boxShadow: `0 0 0 4px ${visual.ringColor}, inset 0 0 0 2px rgb(var(--container-bg-color)), 0 6px 16px rgb(15 23 42 / 10%)`,
    flexShrink: 0,
    cursor: 'pointer',
    display: 'inline-block',
    transition: 'all 0.2s ease'
  };
}

function getStageLineStyle(status?: string) {
  const visual = getStageVisual(status);

  return {
    width: '42px',
    height: '4px',
    margin: '0 8px',
    borderRadius: '999px',
    background: visual.lineColor,
    boxShadow: `inset 0 0 0 1px ${visual.borderColor}`,
    flexShrink: 0,
    display: 'inline-block'
  };
}

function resolveStageResultText(stage: AssessmentInternPathStageVo) {
  if (stage.latestPaperStatus === 'pending_review') return TEXT.pendingReview;
  if (stage.latestPaperPassFlag === true) return TEXT.passed;
  if (stage.latestPaperPassFlag === false) return TEXT.failed;
  if (stage.status === 'in_progress') return TEXT.inProgress;
  if (stage.status === 'skipped') return TEXT.skipped;
  return TEXT.notStarted;
}

function resolveCorrectTotal(stage: AssessmentInternPathStageVo) {
  const hasQuestionTotal = stage.latestPaperQuestionTotal !== null && stage.latestPaperQuestionTotal !== undefined;
  const hasCorrectTotal = stage.latestPaperCorrectTotal !== null && stage.latestPaperCorrectTotal !== undefined;
  if (!hasQuestionTotal && !hasCorrectTotal) return '-';
  return `${stage.latestPaperCorrectTotal ?? 0} / ${stage.latestPaperQuestionTotal ?? 0}`;
}

function renderTooltipContent(stage: AssessmentInternPathStageVo) {
  const rows = [
    { label: TEXT.stageName, value: stage.stageName || '-' },
    { label: TEXT.stageStatus, value: stageStatusDict.getLabel(stage.status) || stage.status || '-' },
    { label: TEXT.result, value: resolveStageResultText(stage) },
    {
      label: TEXT.score,
      value:
        stage.latestPaperScore === null || stage.latestPaperScore === undefined || stage.latestPaperScore === ''
          ? '-'
          : String(stage.latestPaperScore)
    },
    { label: TEXT.correctTotal, value: resolveCorrectTotal(stage) },
    { label: TEXT.examTime, value: stage.latestPaperCreatedAt || '-' },
    { label: TEXT.reviewTime, value: stage.latestPaperReviewedAt || '-' },
    { label: TEXT.comment, value: stage.latestPaperFinalComment || '-' }
  ];

  return (
    <div class="stage-tooltip">
      {rows.map(item => (
        <div key={item.label} class="stage-tooltip__row">
          <span class="stage-tooltip__label">{item.label}：</span>
          <span class="stage-tooltip__value">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function renderStageProgress(stages: AssessmentInternPathStageVo[]) {
  if (!stages.length) {
    return <span class="stage-empty">{TEXT.emptyProgress}</span>;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', minHeight: '36px' }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          maxWidth: '100%',
          overflowX: 'auto',
          padding: '6px 2px'
        }}
      >
        {stages.map((stage, index) => (
          <div
            key={stage.id || stage.stageId || `${index}`}
            style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}
          >
            <NTooltip placement="top" trigger="hover">
              {{
                trigger: () => <span style={getStageDotStyle(stage.status)}></span>,
                default: () => renderTooltipContent(stage)
              }}
            </NTooltip>
            {index < stages.length - 1 && <span style={getStageLineStyle(stage.status)}></span>}
          </div>
        ))}
      </div>
    </div>
  );
}
</script>

<template>
  <SearchTablePageLayout @refresh="loadData">
    <template #searchBox>
      <NGrid :cols="12">
        <NGi span="12">
          <NSpace justify="end">
            <NSelect v-model:value="searchParams.userId" :options="userSelectOptions" clearable filterable :placeholder="TEXT.searchUser" style="width: 220px" />
            <NSelect v-model:value="searchParams.templateId" :options="templateOptions" clearable :placeholder="TEXT.searchTemplate" style="width: 180px" />
            <DictSelect v-model:model-value="searchParams.status" dict-code="assessment_path_status" clearable :placeholder="TEXT.searchStatus" style="width: 140px" />
            <NButton type="primary" @click="handleSearch">{{ TEXT.search }}</NButton>
            <NButton @click="handleReset">{{ TEXT.reset }}</NButton>
          </NSpace>
        </NGi>
      </NGrid>
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
  </SearchTablePageLayout>
</template>

<style scoped lang="scss">
.stage-empty {
  color: var(--n-text-color-3);
}

.stage-tooltip {
  min-width: 260px;
}

.stage-tooltip__row {
  display: flex;
  align-items: flex-start;
  line-height: 1.7;
}

.stage-tooltip__label {
  flex-shrink: 0;
  color: var(--n-text-color-2);
}

.stage-tooltip__value {
  word-break: break-all;
  color: var(--n-text-color-1);
}
</style>
