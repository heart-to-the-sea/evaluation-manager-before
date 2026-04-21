<script setup lang="tsx">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { AddCircle } from '@vicons/ionicons5';
import {
  NButton,
  NDataTable,
  NGrid,
  NGi,
  NIcon,
  NPopconfirm,
  NSpace,
  NSelect,
  NTag,
  NTooltip,
  useThemeVars
} from 'naive-ui';
import type { DataTableColumns, SelectOption } from 'naive-ui';
import DictSelect from '@/components/common/DictSelect.vue';
import DictTag from '@/components/common/DictTag.vue';
import PaperCreateDialog from '@/components/features/intern-assessment/PaperCreateDialog.vue';
import PathDialog from '@/components/features/intern-assessment/PathDialog.vue';
import SearchTablePageLayout from '@/components/pages/SearchTablePageLayout.vue';
import { useDict } from '@/composables/use-dict';
import { useTableSorter } from '@/composables/use-table-sorter';
import {
  fetchAssessmentPathDelete,
  fetchAssessmentPathList,
  fetchAssessmentStageList,
  fetchAssessmentTemplateList,
  fetchUserOptions
} from '@/service/api';
import type { AssessmentInternPathStageVo, AssessmentInternPathVo, UserOptionVo } from '@/types/app';

definePageMeta({
  title: '培训管理'
});

interface RowData extends AssessmentInternPathVo {
  key: string;
}

const TEXT = {
  user: '实习生',
  template: '培训模板',
  trainingStartDate: '培训开始日期',
  trainingEndDate: '培训结束日期',
  totalStatus: '培训状态',
  progress: '阶段进度',
  updatedAt: '更新时间',
  actions: '操作',
  detail: '详情',
  violation: '违规登记',
  createPaper: '发起阶段考核',
  reviewPaper: '阅卷',
  edit: '编辑',
  delete: '删除',
  addPath: '新增培训',
  createPaperHeader: '发起阶段考核',
  searchUser: '请选择实习生',
  searchTemplate: '请选择培训模板',
  searchStatus: '请选择培训状态',
  search: '查询',
  reset: '重置',
  emptyProgress: '暂无阶段',
  stageName: '阶段名称',
  stageStatus: '培训阶段状态',
  studyDays: '学习时间',
  startedAt: '培训开始时间',
  earliestAssessAt: '最早考核时间',
  latestAssessAt: '最晚考核时间',
  timingStatus: '时间状态',
  timingDescription: '时间说明',
  result: '考核结果',
  score: '得分',
  correctTotal: '答对题数',
  examTime: '考核时间',
  reviewTime: '批阅时间',
  comment: '结果说明',
  pendingReview: '待批阅',
  passed: '已通过',
  failed: '未通过',
  inProgress: '培训中',
  skipped: '已跳过',
  ended: '已结束',
  notStarted: '未开始培训',
  deleteConfirm: '确认删除该培训计划吗？',
  deleteSuccess: '培训计划删除成功'
} as const;

const route = useRoute();
const themeVars = useThemeVars();

const loading = ref(false);
const tableData = ref<RowData[]>([]);
const userOptions = ref<UserOptionVo[]>([]);
const stageOptions = ref<SelectOption[]>([]);
const templateOptions = ref<SelectOption[]>([]);
const showPathDialog = ref(false);
const showPaperDialog = ref(false);
const editData = ref<AssessmentInternPathVo | null>(null);
const defaultCreateUserId = ref<string | null>(null);
const defaultCreatePathId = ref<string | null>(null);
const defaultCreatePathStageId = ref<string | null>(null);
const { handleSorter, getSortOrder, appendSorter, createSorter, createSorterRender } = useTableSorter(() => loadData());
const sortableColumnKeys = new Set(['templateName', 'trainingStartDate', 'trainingEndDate', 'status', 'updatedAt']);

const searchParams = ref({
  userId: (route.query.userId as string) || null,
  templateId: null as string | null,
  status: null as string | null
});

const timingStatusDict = useDict('assessment_stage_timing_status');
const stageStatusDict = useDict('assessment_path_stage_status');

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

const columns = computed<DataTableColumns<RowData>>(() => ([
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
    title: TEXT.template,
    key: 'templateName',
    minWidth: 180,
    render: row => row.templateName || '-'
  },
  {
    title: TEXT.trainingStartDate,
    key: 'trainingStartDate',
    width: 140,
    render: row => formatDateOnly(row.trainingStartDate)
  },
  {
    title: TEXT.trainingEndDate,
    key: 'trainingEndDate',
    width: 140,
    render: row => formatDateOnly(row.trainingEndDate)
  },
  {
    title: TEXT.totalStatus,
    key: 'status',
    width: 120,
    align: 'center',
    render: row => <DictTag dictCode="assessment_path_status" value={row.status} />
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
    width: 400,
    fixed: 'right',
    align: 'center',
    render: row => (
      <div class="em-table-actions">
        <NButton size="small" quaternary type="primary" onClick={() => handleViewPath(row)}>
          {TEXT.detail}
        </NButton>
        {!isCompletedPath(row) && (
          <NButton size="small" quaternary type="warning" disabled={!canRegisterViolation(row)} onClick={() => handleRegisterViolation(row)}>
            {TEXT.violation}
          </NButton>
        )}
        {!isCompletedPath(row) && (
          <NButton size="small" quaternary type="primary" onClick={() => handleCreatePaper(row)}>
            {getPaperActionText(row)}
          </NButton>
        )}
        {!isCompletedPath(row) && (
          <NButton size="small" quaternary type="primary" onClick={() => handleEdit(row)}>
            {TEXT.edit}
          </NButton>
        )}
        <NPopconfirm onPositiveClick={() => handleDelete(row)}>
          {{
            trigger: () => (
              <NButton size="small" quaternary type="error">
                {TEXT.delete}
              </NButton>
            ),
            default: () => TEXT.deleteConfirm
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
}));

watch(
  () => route.query.userId,
  value => {
    searchParams.value.userId = (value as string) || null;
    pagination.page = 1;
    loadData();
  }
);

onMounted(async () => {
  await Promise.all([loadUsers(), loadStageOptions(), loadTemplateOptions()]);
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

async function loadStageOptions() {
  const { data, error } = await fetchAssessmentStageList({ pageNum: 1, pageSize: 500, status: '1' });
  if (error) {
    stageOptions.value = [];
    return;
  }
  stageOptions.value = (data?.records || []).map(item => ({
    label: `${item.name || '-'}（${item.code || '-'}）`,
    value: item.id || '',
    minStudyDays: item.minStudyDays,
    maxStudyDays: item.maxStudyDays
  }));
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
    const { data, error } = await fetchAssessmentPathList(appendSorter({
      pageNum: pagination.page,
      pageSize: pagination.pageSize,
      userId: searchParams.value.userId || undefined,
      templateId: searchParams.value.templateId || undefined,
      status: searchParams.value.status || undefined
    }));
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

function handleAdd() {
  editData.value = searchParams.value.userId ? ({ userId: searchParams.value.userId } as AssessmentInternPathVo) : null;
  showPathDialog.value = true;
}

function handleEdit(row: RowData) {
  editData.value = { ...row };
  showPathDialog.value = true;
}

function handleViewPath(row: RowData) {
  if (!row.id) return;
  navigateTo(`/intern-assessment/intern/info/${row.id}`);
}

function canRegisterViolation(row: RowData) {
  return Boolean(row.id && !['completed', 'dismissed', 'voluntary_resigned'].includes(row.status || ''));
}

function isCompletedPath(row: RowData) {
  return row.status === 'completed';
}

function handleRegisterViolation(row: RowData) {
  if (!row.id) return;
  navigateTo({
    path: `/intern-assessment/intern/info/${row.id}`,
    query: { action: 'violation' }
  });
}

function handleCreatePaper(row?: RowData) {
  const currentStage = row ? getCurrentStageForRow(row) : null;
  const latestPaperId = currentStage?.latestPaperId;

  if (latestPaperId) {
    navigateTo(`/intern-assessment/paper/info/${latestPaperId}`);
    return;
  }

  defaultCreateUserId.value = row?.userId || searchParams.value.userId || null;
  defaultCreatePathId.value = row?.id || null;
  defaultCreatePathStageId.value = currentStage?.id || null;
  showPaperDialog.value = true;
}

async function handleDelete(row: RowData) {
  if (!row.id) return;

  const { error } = await fetchAssessmentPathDelete(row.id);
  if (error) return;

  window.$message?.success(TEXT.deleteSuccess);
  await loadData();
}

async function handlePathDialogClose(submitted = false) {
  showPathDialog.value = false;
  editData.value = null;
  if (submitted) {
    await loadData();
  }
}

async function handlePaperDialogClose(submitted = false) {
  showPaperDialog.value = false;
  defaultCreateUserId.value = null;
  defaultCreatePathId.value = null;
  defaultCreatePathStageId.value = null;
  if (submitted) {
    await loadData();
  }
}

function getTimingTagType(status?: string): 'default' | 'success' | 'warning' | 'error' | 'info' {
  if (status === 'assessed_on_time') return 'success';
  if (status === 'assessable' || status === 'assessed_early') return 'warning';
  if (status === 'overdue' || status === 'assessed_overdue') return 'error';
  if (status === 'studying') return 'info';
  return 'default';
}

function getStageVisual(stage: AssessmentInternPathStageVo) {
  const vars = themeVars.value;

  if (stage.timingStatus === 'overdue' || stage.timingStatus === 'assessed_overdue') {
    return {
      dotColor: vars.errorColor,
      ringColor: 'rgb(245 34 45 / 18%)',
      borderColor: 'rgb(245 34 45 / 34%)',
      lineColor: 'rgb(245 34 45 / 44%)'
    };
  }

  if (stage.status === 'passed') {
    return {
      dotColor: vars.successColor,
      ringColor: 'rgb(82 196 26 / 18%)',
      borderColor: 'rgb(82 196 26 / 34%)',
      lineColor: 'rgb(82 196 26 / 56%)'
    };
  }

  if (stage.status === 'in_progress' || stage.status === 'pending_review') {
    return {
      dotColor: vars.warningColor,
      ringColor: 'rgb(250 173 20 / 18%)',
      borderColor: 'rgb(250 173 20 / 34%)',
      lineColor: 'rgb(250 173 20 / 44%)'
    };
  }

  if (stage.status === 'failed') {
    return {
      dotColor: vars.errorColor,
      ringColor: 'rgb(245 34 45 / 18%)',
      borderColor: 'rgb(245 34 45 / 34%)',
      lineColor: 'rgb(245 34 45 / 44%)'
    };
  }

  if (stage.status === 'skipped') {
    return {
      dotColor: vars.infoColor,
      ringColor: 'rgb(32 128 240 / 18%)',
      borderColor: 'rgb(32 128 240 / 34%)',
      lineColor: 'rgb(32 128 240 / 44%)'
    };
  }

  if (stage.status === 'ended') {
    return {
      dotColor: '#8c8c8c',
      ringColor: 'rgb(140 140 140 / 16%)',
      borderColor: 'rgb(140 140 140 / 28%)',
      lineColor: 'rgb(140 140 140 / 40%)'
    };
  }

  return {
    dotColor: 'rgb(var(--layout-bg-color))',
    ringColor: 'rgb(var(--border-color) / 18%)',
    borderColor: 'rgb(var(--border-color) / 80%)',
    lineColor: 'rgb(var(--border-color) / 84%)'
  };
}

function getStageDotStyle(stage: AssessmentInternPathStageVo) {
  const visual = getStageVisual(stage);

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

function getStageLineStyle(stage: AssessmentInternPathStageVo) {
  const visual = getStageVisual(stage);

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
  if (stage.status === 'ended') return TEXT.ended;
  return TEXT.notStarted;
}

function resolveCorrectTotal(stage: AssessmentInternPathStageVo) {
  const hasQuestionTotal = stage.latestPaperQuestionTotal !== null && stage.latestPaperQuestionTotal !== undefined;
  const hasCorrectTotal = stage.latestPaperCorrectTotal !== null && stage.latestPaperCorrectTotal !== undefined;
  if (!hasQuestionTotal && !hasCorrectTotal) return '-';
  return `${stage.latestPaperCorrectTotal ?? 0} / ${stage.latestPaperQuestionTotal ?? 0}`;
}

function resolveStudyDaysText(stage: AssessmentInternPathStageVo) {
  if (stage.minStudyDays == null && stage.maxStudyDays == null) return '未配置';
  if (stage.minStudyDays != null && stage.maxStudyDays != null) return `${stage.minStudyDays}-${stage.maxStudyDays}天`;
  if (stage.minStudyDays != null) return `不少于${stage.minStudyDays}天`;
  return `不超过${stage.maxStudyDays}天`;
}

function getCurrentStageForRow(row?: RowData | null) {
  if (!row?.stages?.length) return null;

  return (
    row.stages.find(item => item.id && (item.id === row.currentStageId || item.stageId === row.currentStageId))
    || row.stages.find(item => item.status === 'in_progress' || item.status === 'failed' || item.status === 'pending' || item.status === 'pending_review')
    || row.stages.find(item => Boolean(item.id))
    || null
  );
}

function getPaperActionText(row: RowData) {
  return getCurrentStageForRow(row)?.latestPaperId ? TEXT.reviewPaper : TEXT.createPaper;
}

function formatDateOnly(value?: string | null) {
  if (!value) return '-';
  return value.includes('T') ? value.split('T')[0] || '-' : value;
}

function renderTooltipContent(stage: AssessmentInternPathStageVo) {
  const rows = [
    { label: TEXT.stageName, value: stage.stageName || '-' },
    { label: TEXT.stageStatus, value: stageStatusDict.getLabel(stage.status) || stage.status || '-' },
    { label: TEXT.studyDays, value: resolveStudyDaysText(stage) },
    { label: TEXT.startedAt, value: stage.startedAt || '-' },
    { label: TEXT.earliestAssessAt, value: stage.earliestAssessAt || '-' },
    { label: TEXT.latestAssessAt, value: stage.latestAssessAt || '-' },
    { label: TEXT.timingStatus, value: timingStatusDict.getLabel(stage.timingStatus) || '-' },
    { label: TEXT.timingDescription, value: stage.timingDescription || '-' },
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
          <div key={stage.id || stage.stageId || `${index}`} style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
            <NTooltip placement="top" trigger="hover">
              {{
                trigger: () => <span style={getStageDotStyle(stage)}></span>,
                default: () => renderTooltipContent(stage)
              }}
            </NTooltip>
            {index < stages.length - 1 && <span style={getStageLineStyle(stage)}></span>}
          </div>
        ))}
      </div>
    </div>
  );
}
</script>

<template>
  <SearchTablePageLayout :pagination="pagination" @refresh="loadData">
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

    <template #h-btns>
      <NButton type="primary" class="mr-8px" @click="handleAdd">
        <NIcon class="mr-6px" size="18"><AddCircle /></NIcon>
        {{ TEXT.addPath }}
      </NButton>
      <NButton @click="handleCreatePaper()">{{ TEXT.createPaperHeader }}</NButton>
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

    <PathDialog
      :show="showPathDialog"
      :data="editData"
      :user-options="userOptions"
      :template-options="templateOptions"
      :stage-options="stageOptions"
      @close="handlePathDialogClose"
    />

    <PaperCreateDialog
      :show="showPaperDialog"
      :user-options="userOptions"
      :default-user-id="defaultCreateUserId"
      :default-path-id="defaultCreatePathId"
      :default-path-stage-id="defaultCreatePathStageId"
      @close="handlePaperDialogClose"
    />
  </SearchTablePageLayout>
</template>

<style scoped lang="scss">
.stage-empty {
  color: var(--n-text-color-3);
}

.stage-tooltip {
  min-width: 280px;
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
