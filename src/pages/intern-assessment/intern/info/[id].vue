<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { ArrowBackOutline, ChevronDownOutline, ChevronForwardOutline } from '@vicons/ionicons5';
import { NButton, NDatePicker, NDescriptions, NDescriptionsItem, NEmpty, NIcon, NInput, NModal, NSpin, NSwitch, NTag } from 'naive-ui';
import DictTag from '@/components/common/DictTag.vue';
import DictSelect from '@/components/common/DictSelect.vue';
import PaperCreateDialog from '@/components/features/intern-assessment/PaperCreateDialog.vue';
import PaperInfoModal from '@/components/features/intern-assessment/PaperInfoModal.vue';
import InfoPageLayout from '@/components/pages/InfoPageLayout.vue';
import {
  fetchAssessmentPaperList,
  fetchAssessmentPathById,
  fetchAssessmentPathStageDailyDelete,
  fetchAssessmentPathStageDailyList,
  fetchAssessmentPathStageDailySave,
  fetchAssessmentPathStageEnd,
  fetchAssessmentPathStageStart,
  fetchUserById
} from '@/service/api';
import type {
  AssessmentInternPathStageVo,
  AssessmentInternPathVo,
  AssessmentPaperVo,
  AssessmentStageDailyReportVo,
  UserOptionVo,
  UserVo
} from '@/types/app';

definePageMeta({
  title: '培训详情'
});

const route = useRoute();

const loading = ref(false);
const showAssessDialog = ref(false);
const showPaperDialog = ref(false);
const showStageEndDialog = ref(false);
const showDailyReportDialog = ref(false);
const activePaperId = ref<string | null>(null);
const assessStage = ref<AssessmentInternPathStageVo | null>(null);
const actionLoadingStageId = ref('');
const endingStage = ref<AssessmentInternPathStageVo | null>(null);
const editingDailyStage = ref<AssessmentInternPathStageVo | null>(null);
const detail = ref<AssessmentInternPathVo | null>(null);
const userDetail = ref<UserVo | null>(null);
const paperRecords = ref<AssessmentPaperVo[]>([]);
const dailyReportMap = ref<Record<string, AssessmentStageDailyReportVo[]>>({});
const expandedStageKeys = ref<string[]>([]);

const stageEndForm = reactive({
  rating: 'B',
  autoStartNext: false
});

const dailyReportForm = reactive({
  id: '',
  reportDate: null as number | null,
  content: '',
  problem: '',
  plan: '',
  remark: ''
});

const pathId = computed(() => String(route.params.id || ''));
const detailDescriptionLabelStyle = {
  width: '116px',
  minWidth: '116px',
  boxSizing: 'border-box'
} as const;
const detailDescriptionContentStyle = {
  minWidth: 0
} as const;

const currentUserOptions = computed<UserOptionVo[]>(() =>
  [
    {
      id: detail.value?.userId || userDetail.value?.id,
      employeeNo: detail.value?.employeeNo || userDetail.value?.employeeNo,
      name: detail.value?.userName || userDetail.value?.name || userDetail.value?.username
    }
  ].filter(item => Boolean(item.id))
);

const stageRecords = computed(() => {
  const recordMap = new Map<string, AssessmentPaperVo[]>();

  for (const record of paperRecords.value) {
    const key = record.pathStageId || record.stageId || '';
    if (!key) continue;
    const list = recordMap.get(key) || [];
    list.push(record);
    recordMap.set(key, list);
  }

  return (detail.value?.stages || []).map(stage => ({
    ...stage,
    records: [...(recordMap.get(stage.id || stage.stageId || '') || [])].sort((left, right) =>
      String(right.createdAt || '').localeCompare(String(left.createdAt || ''))
    ),
    dailyReports: dailyReportMap.value[stage.id || ''] || []
  }));
});

const currentStage = computed(() => {
  const stages = stageRecords.value;
  if (!stages.length) return null;

  return (
    stages.find(item => item.stageId === detail.value?.currentStageId) ||
    stages.find(item => item.status === 'in_progress') ||
    stages.find(item => item.status === 'failed') ||
    stages.find(item => item.status === 'pending') ||
    stages.find(item => item.status === 'pending_review') ||
    stages[0]
  );
});

const currentStageLatestRecord = computed(() => getStageLatestRecord(currentStage.value));
type StageActionMode = 'start' | 'create' | 'review' | 'view' | 'none';
const currentAssessActionMode = computed<StageActionMode>(() => resolveStageActionMode(currentStage.value, currentStageLatestRecord.value));
const canAssessAction = computed(() => currentAssessActionMode.value !== 'none');
const currentAssessActionText = computed(() => {
  if (currentAssessActionMode.value === 'start') return '开始培训';
  if (currentAssessActionMode.value === 'review') return '阅卷';
  if (currentAssessActionMode.value === 'view') return '查看考核';
  if (currentAssessActionMode.value === 'create') return '发起阶段考核';
  return '发起阶段考核';
});

watch(pathId, () => {
  loadDetail();
});

onMounted(() => {
  loadDetail();
});

async function loadDetail() {
  if (!pathId.value) {
    detail.value = null;
    userDetail.value = null;
    paperRecords.value = [];
    return;
  }

  loading.value = true;
  try {
    const { data, error } = await fetchAssessmentPathById(pathId.value);
    if (error || !data) {
      detail.value = null;
      userDetail.value = null;
      paperRecords.value = [];
      dailyReportMap.value = {};
      return;
    }

    detail.value = data;

    const tasks: Promise<unknown>[] = [loadPaperRecords(data.id || ''), loadDailyReports(data.stages || [])];
    if (data.userId) {
      tasks.push(loadUserDetail(data.userId));
    } else {
      userDetail.value = null;
    }

    await Promise.all(tasks);
    syncExpandedStageKeys(data.stages || [], data.currentStageId || '');
  } finally {
    loading.value = false;
  }
}

async function loadUserDetail(userId: string) {
  const { data, error } = await fetchUserById(userId);
  userDetail.value = error ? null : data || null;
}

async function loadPaperRecords(currentPathId: string) {
  if (!currentPathId) {
    paperRecords.value = [];
    return;
  }

  const { data, error } = await fetchAssessmentPaperList({
    pageNum: 1,
    pageSize: 1000,
    pathId: currentPathId
  });

  paperRecords.value = error ? [] : data?.records || [];
}

async function loadDailyReports(stages: AssessmentInternPathStageVo[]) {
  const entries = await Promise.all(
    (stages || [])
      .filter(item => Boolean(item.id))
      .map(async item => {
        const stageId = item.id || '';
        const { data, error } = await fetchAssessmentPathStageDailyList(stageId);
        return [stageId, error ? [] : data || []] as const;
      })
  );
  dailyReportMap.value = Object.fromEntries(entries);
}

function getPaperPassType(record?: AssessmentPaperVo): 'default' | 'success' | 'error' | 'warning' {
  if (record?.status === 'pending_review') return 'warning';
  if (record?.passFlag === true) return 'success';
  if (record?.passFlag === false) return 'error';
  return 'warning';
}

function getStageDotClass(stage: AssessmentInternPathStageVo) {
  if (stage.timingStatus === 'overdue' || stage.timingStatus === 'assessed_overdue') return 'is-error';
  if (stage.status === 'passed') return 'is-success';
  if (stage.status === 'in_progress' || stage.status === 'pending_review') return 'is-warning';
  if (stage.status === 'failed') return 'is-error';
  if (stage.status === 'skipped') return 'is-info';
  return 'is-default';
}

function getStageResultText(stage: AssessmentInternPathStageVo) {
  if (stage.latestPaperStatus === 'pending_review') return '待批阅';
  if (stage.latestPaperPassFlag === true) return '已通过';
  if (stage.latestPaperPassFlag === false) return '未通过';
  if (stage.status === 'in_progress') return '培训中';
  if (stage.status === 'skipped') return '已跳过';
  return '未开始培训';
}

function getStageResultTagType(stage: AssessmentInternPathStageVo): 'default' | 'success' | 'warning' | 'error' | 'info' {
  if (stage.latestPaperStatus === 'pending_review') return 'warning';
  if (stage.latestPaperPassFlag === true) return 'success';
  if (stage.latestPaperPassFlag === false) return 'error';
  if (stage.status === 'in_progress') return 'warning';
  if (stage.status === 'skipped') return 'info';
  return 'default';
}

function getRecordResultText(record: AssessmentPaperVo) {
  if (record.status === 'pending_review') return '待批阅';
  if (record.passFlag === true) return '通过';
  if (record.passFlag === false) return '未通过';
  return '待判定';
}

function resolveStudyDaysText(stage?: AssessmentInternPathStageVo | null) {
  if (!stage) return '-';
  if (stage.minStudyDays == null && stage.maxStudyDays == null) return '未配置';
  if (stage.minStudyDays != null && stage.maxStudyDays != null) return `${stage.minStudyDays}-${stage.maxStudyDays}天`;
  if (stage.minStudyDays != null) return `不少于${stage.minStudyDays}天`;
  return `不超过${stage.maxStudyDays}天`;
}

function resolveStageRatingText(stage?: AssessmentInternPathStageVo | null) {
  return stage?.rating || '-';
}

function resolveActualStudyDaysText(stage?: AssessmentInternPathStageVo | null) {
  if (!stage || stage.studyDurationDays == null) return '-';
  return `${stage.studyDurationDays}天`;
}

function resolveFlagText(value?: boolean | null) {
  if (value === true) return '是';
  if (value === false) return '否';
  return '-';
}

function getStageKey(stage?: Pick<AssessmentInternPathStageVo, 'id' | 'stageId'> | null) {
  return stage?.id || stage?.stageId || '';
}

function syncExpandedStageKeys(stages: AssessmentInternPathStageVo[], currentStageId?: string | null) {
  const validKeys = new Set((stages || []).map(item => getStageKey(item)).filter(Boolean));
  const nextKeys = expandedStageKeys.value.filter(key => validKeys.has(key));
  if (!nextKeys.length) {
    const currentKey = (stages || []).find(item => item.stageId === currentStageId || item.id === currentStageId);
    const fallbackKey = currentKey ? getStageKey(currentKey) : getStageKey(stages?.[0]);
    expandedStageKeys.value = fallbackKey ? [fallbackKey] : [];
    return;
  }
  expandedStageKeys.value = nextKeys;
}

function isStageExpanded(stage: AssessmentInternPathStageVo) {
  return expandedStageKeys.value.includes(getStageKey(stage));
}

function toggleStageExpanded(stage: AssessmentInternPathStageVo) {
  const key = getStageKey(stage);
  if (!key) return;
  expandedStageKeys.value = isStageExpanded(stage)
    ? expandedStageKeys.value.filter(item => item !== key)
    : [...expandedStageKeys.value, key];
}

function formatDateDay(value?: string | null) {
  if (!value) return '-';
  return value.includes('T') ? value.slice(0, 10) : value.slice(0, 10);
}

function resolveStageDurationSummary(stage: AssessmentInternPathStageVo) {
  if (stage.studyDurationDays != null) return `已持续${stage.studyDurationDays}天`;
  if (stage.status === 'pending') return '尚未开始';
  if (stage.status === 'in_progress') return '进行中';
  return '-';
}

function getStageDurationTagType(stage: AssessmentInternPathStageVo): 'default' | 'success' | 'warning' | 'error' | 'info' {
  if (stage.timingStatus === 'overdue' || stage.timingStatus === 'assessed_overdue') return 'error';
  if (stage.studyDurationDays != null) return 'info';
  if (stage.status === 'in_progress') return 'warning';
  if (stage.status === 'passed') return 'success';
  return 'default';
}

function resolveStagePeriodText(stage: AssessmentInternPathStageVo) {
  const startedAt = formatDateDay(stage.startedAt);
  const endedAt = formatDateDay(stage.endedAt);
  if (startedAt === '-' && endedAt === '-') return '-';
  if (endedAt === '-') return `${startedAt} ~ 至今`;
  return `${startedAt} ~ ${endedAt}`;
}

function canStartStage(stage: AssessmentInternPathStageVo) {
  return Boolean(
    detail.value?.status !== 'completed'
    && stage.id
    && ((stage.id && stage.id === currentStage.value?.id) || (stage.stageId && stage.stageId === detail.value?.currentStageId))
    && ['pending', 'failed'].includes(stage.status || '')
  );
}

function canEndStage(stage: AssessmentInternPathStageVo) {
  return Boolean(
    detail.value?.status !== 'completed'
    && ((stage.id && stage.id === currentStage.value?.id) || (stage.stageId && stage.stageId === detail.value?.currentStageId))
    && ['in_progress', 'pending_review', 'failed'].includes(stage.status || '')
  );
}

async function handleStartStage(stage: AssessmentInternPathStageVo) {
  if (!stage.id) return;
  actionLoadingStageId.value = stage.id;
  try {
    const { error } = await fetchAssessmentPathStageStart({ pathStageId: stage.id });
    if (error) return;
    window.$message?.success('阶段已开始');
    await loadDetail();
  } finally {
    actionLoadingStageId.value = '';
  }
}

function openEndStageDialog(stage: AssessmentInternPathStageVo) {
  endingStage.value = stage;
  stageEndForm.rating = stage.rating || 'B';
  stageEndForm.autoStartNext = Boolean(stage.autoStartNext);
  showStageEndDialog.value = true;
}

async function handleSubmitEndStage() {
  if (!endingStage.value?.id) return;
  actionLoadingStageId.value = endingStage.value.id;
  try {
    const { error } = await fetchAssessmentPathStageEnd({
      pathStageId: endingStage.value.id,
      rating: stageEndForm.rating,
      autoStartNext: stageEndForm.autoStartNext
    });
    if (error) return;
    window.$message?.success('阶段已结束');
    showStageEndDialog.value = false;
    endingStage.value = null;
    await loadDetail();
  } finally {
    actionLoadingStageId.value = '';
  }
}

function toDateValue(dateText?: string | null) {
  if (!dateText) return null;
  const date = new Date(dateText);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function formatDateValue(value: number | null) {
  if (!value) return '';
  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function openDailyReportDialog(stage: AssessmentInternPathStageVo, report?: AssessmentStageDailyReportVo | null) {
  editingDailyStage.value = stage;
  dailyReportForm.id = report?.id || '';
  dailyReportForm.reportDate = toDateValue(report?.reportDate || '') || Date.now();
  dailyReportForm.content = report?.content || '';
  dailyReportForm.problem = report?.problem || '';
  dailyReportForm.plan = report?.plan || '';
  dailyReportForm.remark = report?.remark || '';
  showDailyReportDialog.value = true;
}

async function handleSaveDailyReport() {
  if (!editingDailyStage.value?.id || !dailyReportForm.reportDate) return;
  actionLoadingStageId.value = editingDailyStage.value.id;
  try {
    const { error } = await fetchAssessmentPathStageDailySave({
      id: dailyReportForm.id || undefined,
      pathId: editingDailyStage.value.pathId,
      pathStageId: editingDailyStage.value.id,
      userId: editingDailyStage.value.userId,
      reportDate: formatDateValue(dailyReportForm.reportDate),
      content: dailyReportForm.content,
      problem: dailyReportForm.problem,
      plan: dailyReportForm.plan,
      remark: dailyReportForm.remark
    });
    if (error) return;
    window.$message?.success('每日报告已保存');
    showDailyReportDialog.value = false;
    const { data } = await fetchAssessmentPathStageDailyList(editingDailyStage.value.id);
    dailyReportMap.value = {
      ...dailyReportMap.value,
      [editingDailyStage.value.id]: data || []
    };
  } finally {
    actionLoadingStageId.value = '';
  }
}

async function handleDeleteDailyReport(stage: AssessmentInternPathStageVo, report: AssessmentStageDailyReportVo) {
  if (!report.id || !stage.id) return;
  actionLoadingStageId.value = stage.id;
  try {
    const { error } = await fetchAssessmentPathStageDailyDelete(report.id);
    if (error) return;
    window.$message?.success('每日报告已删除');
    const { data } = await fetchAssessmentPathStageDailyList(stage.id);
    dailyReportMap.value = {
      ...dailyReportMap.value,
      [stage.id]: data || []
    };
  } finally {
    actionLoadingStageId.value = '';
  }
}

function handleViewPaper(record: AssessmentPaperVo) {
  if (!record.id) return;
  activePaperId.value = record.id;
  showPaperDialog.value = true;
}

function getStageLatestRecord(stage: (AssessmentInternPathStageVo & { records?: AssessmentPaperVo[] }) | null | undefined) {
  return stage?.records?.[0] || null;
}

function resolveStageActionMode(
  stage: (AssessmentInternPathStageVo & { records?: AssessmentPaperVo[] }) | null | undefined,
  latestRecord: AssessmentPaperVo | null
): StageActionMode {
  if (!detail.value?.id || !detail.value?.userId || !stage || detail.value.status === 'completed') return 'none';
  if (['pending', 'failed'].includes(stage.status || '')) return stage.id ? 'start' : 'none';
  if (stage.status === 'pending_review') return latestRecord?.id ? 'review' : 'none';
  if (stage.status === 'in_progress') return 'create';
  if (latestRecord?.id) return 'view';
  return 'none';
}

function canGenerateStage(stage: AssessmentInternPathStageVo) {
  if (!detail.value?.id || !detail.value?.userId || detail.value.status === 'completed') return false;
  const isCurrentStage = Boolean(
    (stage.id && stage.id === currentStage.value?.id)
    || (stage.stageId && stage.stageId === detail.value.currentStageId)
  );
  return isCurrentStage && stage.status === 'in_progress';
}

function getStageActionText(stage: AssessmentInternPathStageVo & { records?: AssessmentPaperVo[] }) {
  const latestRecord = getStageLatestRecord(stage);
  const actionMode = resolveStageActionMode(stage, latestRecord);
  if (actionMode === 'start') return '开始培训';
  if (actionMode === 'review') return '阅卷';
  if (actionMode === 'view') return '查看考核';
  if (canGenerateStage(stage)) return '发起阶段考核';
  return '';
}

function handleStageAction(stage: AssessmentInternPathStageVo & { records?: AssessmentPaperVo[] }) {
  const latestRecord = getStageLatestRecord(stage);
  const actionMode = resolveStageActionMode(stage, latestRecord);
  if (actionMode === 'start') {
    handleStartStage(stage);
    return;
  }
  if ((actionMode === 'review' || actionMode === 'view') && latestRecord?.id) {
    handleViewPaper(latestRecord);
    return;
  }
  if (actionMode === 'create') {
    assessStage.value = stage;
    showAssessDialog.value = true;
  }
}

function handleAssessCurrentStage() {
  if (!currentStage.value) return;
  if (currentAssessActionMode.value === 'start') {
    handleStartStage(currentStage.value);
    return;
  }
  if ((currentAssessActionMode.value === 'review' || currentAssessActionMode.value === 'view') && currentStageLatestRecord.value?.id) {
    handleViewPaper(currentStageLatestRecord.value);
    return;
  }
  if (currentAssessActionMode.value !== 'create') return;
  assessStage.value = currentStage.value;
  showAssessDialog.value = true;
}

async function handleAssessClose(submitted = false, paperId?: string) {
  showAssessDialog.value = false;
  assessStage.value = null;
  if (submitted) {
    await loadDetail();
    if (paperId) {
      activePaperId.value = paperId;
      showPaperDialog.value = true;
    }
  }
}

function handlePaperDialogClose() {
  showPaperDialog.value = false;
  activePaperId.value = null;
}

async function handlePaperDialogRefresh() {
  await loadDetail();
}
</script>

<template>
  <InfoPageLayout>
    <template #title>培训详情</template>

    <template #actions>
      <NButton
        type="primary"
        :disabled="!canAssessAction"
        :loading="Boolean(currentStage?.id && actionLoadingStageId === currentStage.id)"
        @click="handleAssessCurrentStage"
      >
        {{ currentAssessActionText }}
      </NButton>
      <NButton @click="navigateTo('/intern-assessment/intern')">
        <template #icon>
          <NIcon><ArrowBackOutline /></NIcon>
        </template>
        返回列表
      </NButton>
    </template>

    <template #contentBox>
      <NSpin :show="loading">
          <NEmpty v-if="!detail" description="暂无培训信息" />

          <template v-else>
            <div class="detail-overview-grid">
              <div class="detail-section">
                <div class="detail-section__title">基本信息</div>
                <NDescriptions
                  bordered
                  label-placement="left"
                  :column="2"
                  class="detail-descriptions"
                  :label-style="detailDescriptionLabelStyle"
                  :content-style="detailDescriptionContentStyle"
                >
                  <NDescriptionsItem label="实习生">{{ detail.userName || userDetail?.name || userDetail?.username || '-' }}</NDescriptionsItem>
                  <NDescriptionsItem label="工号">{{ detail.employeeNo || userDetail?.employeeNo || '-' }}</NDescriptionsItem>
                  <NDescriptionsItem label="账号">{{ userDetail?.account || '-' }}</NDescriptionsItem>
                  <NDescriptionsItem label="性别"><DictTag dict-code="employee_gender" :value="userDetail?.gender" /></NDescriptionsItem>
                  <NDescriptionsItem label="手机号">{{ userDetail?.phone || '-' }}</NDescriptionsItem>
                  <NDescriptionsItem label="邮箱">{{ userDetail?.email || '-' }}</NDescriptionsItem>
                  <NDescriptionsItem label="所属部门">{{ userDetail?.departmentName || '-' }}</NDescriptionsItem>
                  <NDescriptionsItem label="岗位"><DictTag dict-code="employee_position" :value="userDetail?.positionName" :fallback-label="userDetail?.positionNameLabel || '-'" /></NDescriptionsItem>
                  <NDescriptionsItem label="用户类型"><DictTag dict-code="user_type" :value="userDetail?.userType" :fallback-label="userDetail?.userTypeLabel || '-'" /></NDescriptionsItem>
                  <NDescriptionsItem label="是否负责人">{{ userDetail?.leaderFlag ? '是' : '否' }}</NDescriptionsItem>
                  <NDescriptionsItem label="入职状态">
                    <DictTag dict-code="employee_job_status" :value="userDetail?.jobStatus" />
                  </NDescriptionsItem>
                  <NDescriptionsItem label="工作状态">
                    <DictTag dict-code="employee_work_status" :value="userDetail?.workStatus" />
                  </NDescriptionsItem>
                  <NDescriptionsItem label="账号状态">
                    <DictTag dict-code="employee_account_status" :value="userDetail?.accountStatus" />
                  </NDescriptionsItem>
                  <NDescriptionsItem label="更新时间">{{ userDetail?.updatedAt || detail.updatedAt || '-' }}</NDescriptionsItem>
                </NDescriptions>
              </div>

              <div class="detail-section">
                <div class="detail-section__title">培训概览</div>
                <NDescriptions
                  bordered
                  label-placement="left"
                  :column="2"
                  class="detail-descriptions"
                  :label-style="detailDescriptionLabelStyle"
                  :content-style="detailDescriptionContentStyle"
                >
                  <NDescriptionsItem label="培训模板">{{ detail.templateName || '-' }}</NDescriptionsItem>
                  <NDescriptionsItem label="培训开始时间">{{ detail.trainingStartDate || '-' }}</NDescriptionsItem>
                  <NDescriptionsItem label="培训结束时间">{{ detail.trainingEndDate || '-' }}</NDescriptionsItem>
                  <NDescriptionsItem label="当前培训阶段">{{ detail.currentStageName || '-' }}</NDescriptionsItem>
                  <NDescriptionsItem label="培训状态">
                    <DictTag dict-code="assessment_path_status" :value="detail.status" />
                  </NDescriptionsItem>
                  <NDescriptionsItem label="阶段数量">{{ detail.stages?.length || 0 }}</NDescriptionsItem>
                  <NDescriptionsItem label="当前学习时间">{{ resolveStudyDaysText(currentStage) }}</NDescriptionsItem>
                  <NDescriptionsItem label="当前阶段时间状态">
                    <DictTag dict-code="assessment_stage_timing_status" :value="currentStage?.timingStatus" />
                  </NDescriptionsItem>
                  <NDescriptionsItem label="培训开始时间">{{ currentStage?.startedAt || '-' }}</NDescriptionsItem>
                  <NDescriptionsItem label="培训结束时间">{{ currentStage?.endedAt || '-' }}</NDescriptionsItem>
                  <NDescriptionsItem label="实际学习天数">{{ resolveActualStudyDaysText(currentStage) }}</NDescriptionsItem>
                  <NDescriptionsItem label="考核时间">{{ currentStage?.assessAt || '-' }}</NDescriptionsItem>
                  <NDescriptionsItem label="培训是否超时">{{ resolveFlagText(currentStage?.overtimeFlag) }}</NDescriptionsItem>
                  <NDescriptionsItem label="考核是否延迟">{{ resolveFlagText(currentStage?.delayedAssessFlag) }}</NDescriptionsItem>
                  <NDescriptionsItem label="最早考核时间">{{ currentStage?.earliestAssessAt || '-' }}</NDescriptionsItem>
                  <NDescriptionsItem label="最晚考核时间">{{ currentStage?.latestAssessAt || '-' }}</NDescriptionsItem>
                  <NDescriptionsItem label="时间说明">{{ currentStage?.timingDescription || '-' }}</NDescriptionsItem>
                </NDescriptions>
              </div>
            </div>

            <div class="detail-section">
              <div class="detail-section__title">培训阶段与履历</div>
              <div v-if="stageRecords.length" class="stage-list">
                <div v-for="(stage, index) in stageRecords" :key="stage.id || stage.stageId || index" class="stage-item">
                  <div class="stage-item__rail">
                    <div class="stage-dot" :class="getStageDotClass(stage)"></div>
                    <div v-if="index < stageRecords.length - 1" class="stage-line"></div>
                  </div>

                  <div class="stage-item__body">
                    <div class="stage-item__header" @click="toggleStageExpanded(stage)">
                      <div class="stage-item__title">
                        <span>{{ stage.stageName || '-' }}</span>
                        <DictTag dict-code="assessment_path_stage_status" :value="stage.status" />
                        <DictTag dict-code="assessment_stage_timing_status" :value="stage.timingStatus" />
                      </div>
                      <div class="stage-item__meta">
                        <div class="stage-item__meta-tag">
                          <span class="stage-item__meta-label">执行情况</span>
                          <NTag size="small" :bordered="false" :type="getStageResultTagType(stage)">
                            {{ getStageResultText(stage) }}
                          </NTag>
                        </div>
                        <div class="stage-item__meta-tag">
                          <span class="stage-item__meta-label">持续情况</span>
                          <NTag size="small" :bordered="false" :type="getStageDurationTagType(stage)">
                            {{ resolveStageDurationSummary(stage) }}
                          </NTag>
                        </div>
                        <div class="stage-item__meta-tag">
                          <span class="stage-item__meta-label">培训区间</span>
                          <NTag size="small" :bordered="false" type="info">
                            {{ resolveStagePeriodText(stage) }}
                          </NTag>
                        </div>
                        <div class="stage-item__meta-tag">
                          <span class="stage-item__meta-label">考核日期</span>
                          <NTag size="small" :bordered="false" type="warning">
                            {{ formatDateDay(stage.assessAt) }}
                          </NTag>
                        </div>
                        <div class="stage-item__meta-tag">
                          <span class="stage-item__meta-label">评级</span>
                          <DictTag
                            dict-code="assessment_stage_rating"
                            :value="stage.rating"
                            :fallback-label="resolveStageRatingText(stage)"
                            size="small"
                          />
                        </div>
                      </div>
                      <div class="stage-item__header-actions">
                        <NButton
                          v-if="canStartStage(stage)"
                          size="small"
                          type="primary"
                          :loading="actionLoadingStageId === stage.id"
                          @click.stop="handleStartStage(stage)"
                        >
                          开始阶段
                        </NButton>
                        <NButton
                          v-if="canEndStage(stage)"
                          size="small"
                          secondary
                          :loading="actionLoadingStageId === stage.id"
                          @click.stop="openEndStageDialog(stage)"
                        >
                          结束阶段
                        </NButton>
                        <NButton quaternary size="small" class="stage-item__toggle" @click.stop="toggleStageExpanded(stage)">
                          <template #icon>
                            <NIcon>
                              <component :is="isStageExpanded(stage) ? ChevronDownOutline : ChevronForwardOutline" />
                            </NIcon>
                          </template>
                          {{ isStageExpanded(stage) ? '收起明细' : '展开明细' }}
                        </NButton>
                      </div>
                    </div>

                    <div v-show="isStageExpanded(stage)" class="stage-item__detail">
                      <div class="stage-item__actions">
                        <NButton size="small" quaternary type="primary" @click="openDailyReportDialog(stage, null)">新增日报</NButton>
                      </div>

                      <div class="stage-summary">
                        <div class="stage-summary__item">学习时间：{{ resolveStudyDaysText(stage) }}</div>
                        <div class="stage-summary__item">培训开始：{{ stage.startedAt || '-' }}</div>
                        <div class="stage-summary__item">培训结束：{{ stage.endedAt || '-' }}</div>
                        <div class="stage-summary__item">实际学习天数：{{ resolveActualStudyDaysText(stage) }}</div>
                        <div class="stage-summary__item">考核时间：{{ stage.assessAt || '-' }}</div>
                        <div class="stage-summary__item">最早考核：{{ stage.earliestAssessAt || '-' }}</div>
                        <div class="stage-summary__item">最晚考核：{{ stage.latestAssessAt || '-' }}</div>
                        <div class="stage-summary__item">培训超时：{{ resolveFlagText(stage.overtimeFlag) }}</div>
                        <div class="stage-summary__item">考核延迟：{{ resolveFlagText(stage.delayedAssessFlag) }}</div>
                        <div class="stage-summary__item">阶段评级：{{ resolveStageRatingText(stage) }}</div>
                        <div class="stage-summary__item">自动开始下一阶段：{{ stage.autoStartNext ? '是' : '否' }}</div>
                        <div class="stage-summary__item">时间说明：{{ stage.timingDescription || '-' }}</div>
                        <div class="stage-summary__item">
                          答对题数：{{ stage.latestPaperQuestionTotal == null ? '-' : `${stage.latestPaperCorrectTotal ?? 0} / ${stage.latestPaperQuestionTotal ?? 0}` }}
                        </div>
                        <div class="stage-summary__item">最近得分：{{ stage.latestPaperScore ?? '-' }}</div>
                        <div class="stage-summary__item">结果说明：{{ stage.latestPaperFinalComment || '-' }}</div>
                      </div>

                      <div class="record-list">
                      <div class="record-list__title">阶段考核记录</div>

                      <div v-if="stage.records.length" class="record-items">
                        <div v-for="record in stage.records" :key="record.id" class="record-item">
                          <div class="record-item__main">
                            <div class="record-item__title">
                              <span>{{ record.stageName || stage.stageName || '-' }}</span>
                              <DictTag dict-code="assessment_paper_status" :value="record.status" />
                              <NTag :bordered="false" :type="getPaperPassType(record)">
                                {{ getRecordResultText(record) }}
                              </NTag>
                            </div>

                            <div class="record-item__meta">
                              <span>考核时间：{{ record.createdAt || '-' }}</span>
                              <span>批阅时间：{{ record.reviewedAt || '-' }}</span>
                              <span>得分：{{ record.score ?? '-' }}</span>
                              <span>答对：{{ record.questionTotal == null ? '-' : `${record.correctTotal ?? 0} / ${record.questionTotal ?? 0}` }}</span>
                            </div>

                            <div class="record-item__comment">评语：{{ record.finalComment || '-' }}</div>
                          </div>

                          <div class="record-item__actions">
                            <NButton
                              size="small"
                              quaternary
                              :type="record.status === 'pending_review' ? 'warning' : 'primary'"
                              @click="handleViewPaper(record)"
                            >
                              {{ record.status === 'pending_review' ? '阅卷' : '查看考核' }}
                            </NButton>
                          </div>
                        </div>
                      </div>

                      <div v-else class="record-list__empty">
                        <NEmpty description="当前阶段暂无阶段考核记录" />
                        <NButton
                          v-if="getStageActionText(stage)"
                          size="small"
                          quaternary
                          :type="getStageLatestRecord(stage)?.status === 'pending_review' ? 'warning' : 'primary'"
                          @click="handleStageAction(stage)"
                        >
                          {{ getStageActionText(stage) }}
                        </NButton>
                      </div>
                      </div>

                      <div class="daily-report-section">
                      <div class="daily-report-section__header">
                        <div class="record-list__title">每日报告</div>
                        <NButton size="small" quaternary type="primary" @click="openDailyReportDialog(stage, null)">新增汇报</NButton>
                      </div>
                      <div v-if="stage.dailyReports.length" class="daily-report-list">
                        <div v-for="report in stage.dailyReports" :key="report.id" class="daily-report-item">
                          <div class="daily-report-item__header">
                            <div class="daily-report-item__date">{{ report.reportDate || '-' }}</div>
                            <div class="daily-report-item__actions">
                              <NButton size="tiny" quaternary type="primary" @click="openDailyReportDialog(stage, report)">编辑</NButton>
                              <NButton size="tiny" quaternary type="error" @click="handleDeleteDailyReport(stage, report)">删除</NButton>
                            </div>
                          </div>
                          <div class="daily-report-item__content">今日情况：{{ report.content || '-' }}</div>
                          <div class="daily-report-item__content">问题记录：{{ report.problem || '-' }}</div>
                          <div class="daily-report-item__content">明日计划：{{ report.plan || '-' }}</div>
                          <div class="daily-report-item__content">备注：{{ report.remark || '-' }}</div>
                        </div>
                      </div>
                      <NEmpty v-else description="当前阶段暂无每日报告" />
                    </div>
                    </div>
                  </div>
                </div>
              </div>

              <NEmpty v-else description="暂无阶段信息" />
            </div>
          </template>
      </NSpin>

      <PaperCreateDialog
        :show="showAssessDialog"
        :user-options="currentUserOptions"
        :default-user-id="detail?.userId || null"
        :default-path-id="detail?.id || null"
        :default-path-stage-id="assessStage?.id || currentStage?.id || null"
        :default-path-stage-name="assessStage?.stageName || currentStage?.stageName || detail?.currentStageName || null"
        :default-path-stage-status="assessStage?.status || currentStage?.status || null"
        :default-template-name="detail?.templateName || null"
        :lock-current-stage="true"
        @close="handleAssessClose"
      />

      <PaperInfoModal :show="showPaperDialog" :paper-id="activePaperId" @close="handlePaperDialogClose" @refresh="handlePaperDialogRefresh" />

      <NModal
        :show="showStageEndDialog"
        preset="card"
        title="结束阶段"
        :style="{ width: '420px' }"
        @update:show="value => !value && (showStageEndDialog = false)"
      >
        <div class="stage-dialog-form">
          <div class="stage-dialog-form__item">
            <div class="stage-dialog-form__label">阶段评级</div>
            <DictSelect v-model:model-value="stageEndForm.rating" dict-code="assessment_stage_rating" />
          </div>
          <div class="stage-dialog-form__item">
            <div class="stage-dialog-form__label">自动开始下一阶段</div>
            <NSwitch v-model:value="stageEndForm.autoStartNext" />
          </div>
        </div>
        <template #action>
          <div class="stage-dialog-actions">
            <NButton @click="showStageEndDialog = false">取消</NButton>
            <NButton type="primary" :loading="actionLoadingStageId === endingStage?.id" @click="handleSubmitEndStage">确认结束</NButton>
          </div>
        </template>
      </NModal>

      <NModal
        :show="showDailyReportDialog"
        preset="card"
        title="每日报告"
        :style="{ width: '640px', maxWidth: 'calc(100vw - 32px)' }"
        @update:show="value => !value && (showDailyReportDialog = false)"
      >
        <div class="stage-dialog-form">
          <div class="stage-dialog-form__item">
            <div class="stage-dialog-form__label">汇报日期</div>
            <NDatePicker v-model:value="dailyReportForm.reportDate" type="date" clearable />
          </div>
          <div class="stage-dialog-form__item">
            <div class="stage-dialog-form__label">今日情况</div>
            <NInput v-model:value="dailyReportForm.content" type="textarea" :rows="3" />
          </div>
          <div class="stage-dialog-form__item">
            <div class="stage-dialog-form__label">问题记录</div>
            <NInput v-model:value="dailyReportForm.problem" type="textarea" :rows="3" />
          </div>
          <div class="stage-dialog-form__item">
            <div class="stage-dialog-form__label">明日计划</div>
            <NInput v-model:value="dailyReportForm.plan" type="textarea" :rows="3" />
          </div>
          <div class="stage-dialog-form__item">
            <div class="stage-dialog-form__label">备注</div>
            <NInput v-model:value="dailyReportForm.remark" type="textarea" :rows="2" />
          </div>
        </div>
        <template #action>
          <div class="stage-dialog-actions">
            <NButton @click="showDailyReportDialog = false">取消</NButton>
            <NButton type="primary" :loading="actionLoadingStageId === editingDailyStage?.id" @click="handleSaveDailyReport">保存</NButton>
          </div>
        </template>
      </NModal>
    </template>
  </InfoPageLayout>
</template>

<style scoped lang="scss">

.detail-overview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  align-items: start;
}

.detail-overview-grid .detail-section {
  min-width: 0;
}

.detail-overview-grid .detail-section + .detail-section {
  margin-top: 0;
}

.detail-overview-grid + .detail-section {
  margin-top: 20px;
}

.detail-section + .detail-section {
  margin-top: 20px;
}

.detail-section__title {
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
}

.detail-section :deep(.n-descriptions) {
  margin: 0;
}

.detail-section :deep(.detail-descriptions .n-descriptions-table-header) {
  white-space: nowrap;
}

.stage-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stage-item {
  display: flex;
  gap: 14px;
}

.stage-item__rail {
  display: flex;
  width: 20px;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.stage-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid rgb(var(--border-color));
  background: rgb(var(--layout-bg-color));
  box-shadow:
    0 0 0 4px rgb(var(--border-color) / 18%),
    inset 0 0 0 2px rgb(var(--container-bg-color)),
    0 6px 16px rgb(15 23 42 / 10%);
}

.stage-dot.is-success {
  border-color: rgb(82 196 26 / 34%);
  background: rgb(82 196 26);
  box-shadow:
    0 0 0 4px rgb(82 196 26 / 18%),
    inset 0 0 0 2px rgb(var(--container-bg-color)),
    0 6px 16px rgb(15 23 42 / 10%);
}

.stage-dot.is-warning {
  border-color: rgb(250 173 20 / 34%);
  background: rgb(250 173 20);
  box-shadow:
    0 0 0 4px rgb(250 173 20 / 18%),
    inset 0 0 0 2px rgb(var(--container-bg-color)),
    0 6px 16px rgb(15 23 42 / 10%);
}

.stage-dot.is-error {
  border-color: rgb(245 34 45 / 34%);
  background: rgb(245 34 45);
  box-shadow:
    0 0 0 4px rgb(245 34 45 / 18%),
    inset 0 0 0 2px rgb(var(--container-bg-color)),
    0 6px 16px rgb(15 23 42 / 10%);
}

.stage-dot.is-info {
  border-color: rgb(32 128 240 / 34%);
  background: rgb(32 128 240);
  box-shadow:
    0 0 0 4px rgb(32 128 240 / 18%),
    inset 0 0 0 2px rgb(var(--container-bg-color)),
    0 6px 16px rgb(15 23 42 / 10%);
}

.stage-line {
  width: 2px;
  flex: 1;
  margin-top: 6px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgb(var(--border-color)) 0%, rgb(var(--border-color) / 38%) 100%);
}

.stage-item__body {
  flex: 1;
  min-width: 0;
  padding: 16px;
  border-radius: 14px;
  background: rgb(var(--container-bg-color));
  box-shadow:
    inset 0 0 0 1px rgb(var(--border-color)),
    0 1px 2px rgb(31 35 41 / 4%);
}

html.dark .stage-item__body {
  box-shadow:
    inset 0 0 0 1px rgb(var(--border-color)),
    0 1px 2px rgb(0 0 0 / 18%);
}

.stage-item__header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  column-gap: 16px;
  row-gap: 12px;
  margin-bottom: 12px;
  cursor: pointer;
}

.stage-item__title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.2;
}

.stage-item__toggle {
  flex-shrink: 0;
  align-self: center;
}

.stage-item__header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: nowrap;
  flex-shrink: 0;
}

.stage-item__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 12px 16px;
  min-width: 0;
}

.stage-item__meta-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 28px;
  white-space: nowrap;
}

.stage-item__meta-label {
  min-width: 56px;
  color: var(--n-text-color-3);
  font-size: 13px;
  line-height: 1;
  text-align: right;
}

.stage-item__detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stage-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.stage-summary__item {
  padding: 10px 12px;
  border-radius: 10px;
  background: rgb(var(--layout-bg-color));
  box-shadow: inset 0 0 0 1px rgb(var(--border-color) / 85%);
  color: var(--n-text-color-2);
}

.record-list__title {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
}

.record-list__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.record-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.record-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border-radius: 12px;
  background: rgb(var(--layout-bg-color));
  box-shadow: inset 0 0 0 1px rgb(var(--border-color) / 85%);
}

.record-item__main {
  flex: 1;
  min-width: 0;
}

.record-item__title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-weight: 600;
}

.record-item__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  color: var(--n-text-color-3);
  font-size: 13px;
}

.record-item__comment {
  margin-top: 8px;
  color: var(--n-text-color-2);
  word-break: break-all;
}

.record-item__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.stage-item__actions,
.daily-report-item__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stage-item__actions {
  flex-wrap: nowrap;
  justify-content: flex-end;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 2px;
}

.stage-item__actions :deep(.n-button),
.record-item__actions :deep(.n-button),
.daily-report-item__actions :deep(.n-button),
.record-list__empty :deep(.n-button),
.daily-report-section__header :deep(.n-button) {
  min-width: 64px;
  height: 28px !important;
  padding: 0 12px !important;
  border-radius: 6px !important;
  font-size: 12px !important;
}

@media (width <= 960px) {
  .detail-overview-grid {
    grid-template-columns: 1fr;
  }

  .stage-item__header,
  .record-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .stage-item__header {
    display: flex;
    gap: 10px;
  }

  .stage-item__header-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .stage-item__meta {
    justify-content: flex-start;
  }

  .stage-item__meta-tag {
    width: auto;
  }

  .stage-item__meta-label {
    min-width: 64px;
    text-align: left;
  }

  .stage-item__actions {
    flex-wrap: wrap;
    overflow: visible;
  }

  .stage-summary {
    grid-template-columns: 1fr;
  }
}
</style>
