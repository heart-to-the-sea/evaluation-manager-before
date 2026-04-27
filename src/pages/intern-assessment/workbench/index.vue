<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { NButton, NImagePreview, NInput, NModal, NTag, NTooltip } from 'naive-ui';
import InfoPageLayout from '@/components/pages/InfoPageLayout.vue';
import InfoGridCard from '@/components/common/InfoGridCard.vue';
import DictTag from '@/components/common/DictTag.vue';
import MarkdownEditor from '@/components/common/MarkdownEditor.vue';
import WorkbenchDailyCalendar from '@/components/features/intern-assessment/WorkbenchDailyCalendar.vue';
import { renderMarkdown } from '@/utils/markdown';
import {
  fetchAssessmentPathById,
  fetchAssessmentPathDailyCalendar,
  fetchAssessmentPathList,
  fetchAssessmentPathStageAchievementDelete,
  fetchAssessmentPathStageAchievementSave,
  fetchAssessmentPathStageAchievementSubmit,
  fetchAssessmentPathStageAssessRequest,
  fetchAssessmentPathStageDailyList,
  fetchAssessmentPathStageDailySave,
  fetchAssessmentStageById,
  fetchFileRecordUpload,
  fetchStorageConfigOptions
} from '@/service/api';
import { useAuthStore } from '@/stores/auth';
import type {
  AssessmentInternPathStageVo,
  AssessmentInternPathVo,
  AssessmentPathDailyCalendarVo,
  AssessmentStageAchievementVo,
  AssessmentStageDailyReportVo,
  AssessmentStageMaterialVo,
  AssessmentStageVo
} from '@/types/app';

definePageMeta({
  title: '学员工作台'
});

const authStore = useAuthStore();
const detail = ref<AssessmentInternPathVo | null>(null);
const currentStageEntity = ref<AssessmentInternPathStageVo | null>(null);
const stageDetail = ref<AssessmentStageVo | null>(null);
const userDisplayName = ref('张三');
const userGreeting = ref('欢迎回来，继续加油！');
const currentStageStatusValue = ref('in_progress');
const todayText = formatDateOnly(new Date());
const showAssessmentModal = ref(false);
const showAchievementModal = ref(false);
const showImagePreview = ref(false);
const previewImageSrc = ref('');
const achievementUploading = ref(false);
const achievementSubmitLoading = ref(false);
const deletingAchievementId = ref('');
const achievementInputRef = ref<HTMLInputElement | null>(null);
const pendingAchievementFile = ref<File | null>(null);

// Markdown 渲染器
type WorkbenchStageItem = {
  id: string;
  name: string;
  status: string;
  progress: number;
  startedAt: string | null;
};

type WorkbenchReportItem = {
  id?: string;
  date: string;
  pathStageId?: string;
  stageName?: string;
  status?: 'submitted' | 'pending';
  content: string;
  plan: string;
  problem: string;
  remark: string;
  updatedAt?: string;
};

const mockPathInfo = reactive({
  name: '暂无培训计划',
  startedAt: '-',
  expectedEndAt: '-'
});

const mockStages = reactive<WorkbenchStageItem[]>([]);

// 主题颜色
const themeVars = computed(() => ({
  infoColor: 'rgb(32 128 240)',
  successColor: 'rgb(82 196 26)',
  warningColor: 'rgb(250 173 20)',
  errorColor: 'rgb(245 34 45)'
}));

// 获取阶段视觉样式
function getStageVisual(stage: typeof mockStages[0]) {
  const vars = themeVars.value;
  switch (stage.status) {
    case 'passed':
      return {
        dotColor: vars.successColor,
        ringColor: 'rgb(82 196 26 / 18%)',
        borderColor: 'rgb(82 196 26 / 34%)',
        lineColor: 'rgb(82 196 26 / 56%)'
      };
    case 'in_progress':
      return {
        dotColor: vars.infoColor,
        ringColor: 'rgb(32 128 240 / 18%)',
        borderColor: 'rgb(32 128 240 / 34%)',
        lineColor: 'rgb(32 128 240 / 44%)'
      };
    case 'pending_review':
      return {
        dotColor: vars.warningColor,
        ringColor: 'rgb(250 173 20 / 18%)',
        borderColor: 'rgb(250 173 20 / 34%)',
        lineColor: 'rgb(250 173 20 / 44%)'
      };
    case 'failed':
      return {
        dotColor: vars.errorColor,
        ringColor: 'rgb(245 34 45 / 18%)',
        borderColor: 'rgb(245 34 45 / 34%)',
        lineColor: 'rgb(245 34 45 / 44%)'
      };
    default:
      return {
        dotColor: 'rgb(var(--layout-bg-color))',
        ringColor: 'rgb(var(--border-color) / 18%)',
        borderColor: 'rgb(var(--border-color) / 80%)',
        lineColor: 'rgb(var(--border-color) / 84%)'
      };
  }
}

// 获取节点样式
function getStageDotStyle(stage: typeof mockStages[0]) {
  const visual = getStageVisual(stage);
  return {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    background: visual.dotColor,
    border: `1px solid ${visual.borderColor}`,
    boxShadow: `0 0 0 3px ${visual.ringColor}, inset 0 0 0 1.5px rgb(var(--container-bg-color)), 0 4px 12px rgb(15 23 42 / 10%)`,
    flexShrink: 0,
    cursor: 'pointer',
    display: 'inline-block',
    transition: 'all 0.2s ease'
  };
}

// 获取连接线样式
function getStageLineStyle(stage: typeof mockStages[0]) {
  const visual = getStageVisual(stage);
  return {
    width: '36px',
    height: '3px',
    margin: '0 6px',
    borderRadius: '999px',
    background: visual.lineColor,
    boxShadow: `inset 0 0 0 1px ${visual.borderColor}`,
    flexShrink: 0,
    display: 'inline-block',
    verticalAlign: 'middle',
    alignSelf: 'center'
  };
}

// 获取边界节点样式
function getBoundaryDotStyle(isStart: boolean, hasContent: boolean) {
  if (hasContent) {
    return {
      width: '16px',
      height: '16px',
      borderRadius: '50%',
      background: themeVars.value.infoColor,
      border: `1px solid rgb(32 128 240 / 34%)`,
      boxShadow: `0 0 0 3px rgb(32 128 240 / 18%), inset 0 0 0 1.5px rgb(var(--container-bg-color)), 0 4px 12px rgb(15 23 42 / 10%)`,
      flexShrink: 0,
      cursor: 'pointer',
      display: 'inline-block',
      transition: 'all 0.2s ease'
    };
  }
  return {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    background: 'rgb(var(--layout-bg-color))',
    border: `1px solid rgb(var(--border-color) / 80%)`,
    boxShadow: `0 0 0 3px rgb(var(--border-color) / 18%), inset 0 0 0 1.5px rgb(var(--container-bg-color)), 0 4px 12px rgb(15 23 42 / 10%)`,
    flexShrink: 0,
    cursor: 'pointer',
    display: 'inline-block',
    transition: 'all 0.2s ease'
  };
}

// 获取边界连接线样式
function getBoundaryLineStyle(hasContent: boolean) {
  if (hasContent) {
    return {
      width: '36px',
      height: '3px',
      margin: '0 6px',
      borderRadius: '999px',
      background: 'rgb(32 128 240 / 44%)',
      boxShadow: `inset 0 0 0 1px rgb(32 128 240 / 34%)`,
      flexShrink: 0,
      display: 'inline-block'
    };
  }
  return {
    width: '36px',
    height: '3px',
    margin: '0 6px',
    borderRadius: '999px',
    background: 'rgb(var(--border-color) / 84%)',
    boxShadow: `inset 0 0 0 1px rgb(var(--border-color) / 80%)`,
    flexShrink: 0,
    display: 'inline-block'
  };
}

const mockCurrentStage = reactive({
  name: '暂无当前阶段',
  status: '未开始',
  studyDays: '未配置',
  duration: '暂无进度',
  startDate: '-',
  description: '暂无阶段说明',
  assessmentDescription: '暂无考核说明'
});

const mockLearningTasks = reactive<Array<{ title: string; type: string; fileType: string; url: string }>>([]);

const currentStageAchievements = computed<AssessmentStageAchievementVo[]>(() => currentStageEntity.value?.achievements || []);
const currentStageAchievementRequired = computed(() => {
  return Boolean(currentStageEntity.value?.achievementRequired) || Boolean(stageDetail.value?.achievementRequired);
});
const currentStageAchievementUploaded = computed(() =>
  Boolean(currentStageEntity.value?.achievementUploadedFlag) || currentStageAchievements.value.length > 0
);
const currentStageAchievementSubmitted = computed(() => Boolean(currentStageEntity.value?.achievementSubmittedFlag));
const canUploadCurrentStageAchievement = computed(() => {
  const stage = currentStageEntity.value;
  if (!stage?.id) return false;
  if (currentStageAchievementSubmitted.value) return false;
  return Boolean(stage.latestPaperStatus === 'reviewed' || stage.reviewedAt);
});
const canSubmitCurrentStageAchievement = computed(() => {
  const stage = currentStageEntity.value;
  if (!stage?.id) return false;
  if (currentStageAchievementSubmitted.value) return false;
  if (!currentStageAchievementUploaded.value) return false;
  return Boolean(stage.latestPaperStatus === 'reviewed' || stage.reviewedAt);
});
const canDeleteCurrentStageAchievement = computed(() =>
  !currentStageAchievementSubmitted.value
  && !['pending_review', 'passed', 'failed', 'ended', 'skipped'].includes(currentStageEntity.value?.status || '')
);
const currentStageAchievementStatusText = computed(() => {
  if (!currentStageAchievementRequired.value) return '非必传';
  if (currentStageAchievementSubmitted.value) return '已提交';
  return currentStageAchievementUploaded.value ? '待提交' : '待上传';
});
const currentStageAchievementStatusType = computed(() => {
  if (!currentStageAchievementRequired.value) return 'default' as const;
  if (currentStageAchievementSubmitted.value) return 'success' as const;
  return currentStageAchievementUploaded.value ? 'warning' as const : 'warning' as const;
});

// 判断是否为多媒体文件
function isMultimedia(fileType: string): boolean {
  return ['video', 'audio'].includes(fileType);
}

const mockReports = reactive<WorkbenchReportItem[]>([]);

const hasTodayReport = ref(false);

// 弹窗状态
const showReportModal = ref(false);
const reportSubmitting = ref(false);
const reportForm = reactive({
  content: '',
  plan: ''
});

const assessmentForm = reactive({
  reason: ''
});

const achievementForm = reactive({
  remark: ''
});

// 当前编辑的日报
const currentEditReport = ref<WorkbenchReportItem | null>(null);
const rawStageReports = ref<AssessmentStageDailyReportVo[]>([]);

// 查看日报弹窗状态
const showViewReportModal = ref(false);
const currentViewReport = ref<WorkbenchReportItem | null>(null);

function openReportModal() {
  const todayReport = rawStageReports.value
    .filter(item => formatDateOnly(item.reportDate) === todayText)
    .map(item => ({
      id: item.id,
      date: formatDateOnly(item.reportDate),
      pathStageId: item.pathStageId,
      stageName: resolveStageName(item.pathStageId),
      status: 'submitted' as const,
      content: item.content || '',
      plan: item.plan || '',
      problem: item.problem || '',
      remark: item.remark || '',
      updatedAt: item.updatedAt || item.createdAt || ''
    }))[0] || null;
  currentEditReport.value = todayReport;
  fillReportForm(todayReport);
  showReportModal.value = true;
}

function closeReportModal() {
  showReportModal.value = false;
  currentEditReport.value = null;
  resetReportForm();
}

function openViewReportModal(report: WorkbenchReportItem) {
  currentViewReport.value = report;
  showViewReportModal.value = true;
}

const currentViewReportContent = computed(() => currentViewReport.value?.content || '当日未提交日报');

function closeViewReportModal() {
  showViewReportModal.value = false;
  currentViewReport.value = null;
}

function handleSubmitReport() {
  if (reportSubmitting.value) return;
  submitTodayReport();
}

async function submitTodayReport() {
  if (reportSubmitting.value) return;
  if (!detail.value?.id || !currentStageEntity.value?.id) {
    window.$message?.warning('当前暂无可提交日报的培训阶段');
    return;
  }

  if (!String(reportForm.content || '').trim()) {
    window.$message?.warning('请填写日报内容');
    return;
  }

  reportSubmitting.value = true;
  try {
    const { error } = await fetchAssessmentPathStageDailySave({
      id: currentEditReport.value?.id,
      pathId: detail.value.id,
      pathStageId: currentStageEntity.value.id,
      userId: detail.value.userId,
      reportDate: todayText,
      content: reportForm.content.trim(),
      plan: reportForm.plan.trim(),
      problem: currentEditReport.value?.problem || '',
      remark: currentEditReport.value?.remark || ''
    });

    if (error) {
      return;
    }

    await Promise.all([
      loadDailyReports(currentStageEntity.value.id),
      loadDailyCalendar(detail.value.id)
    ]);

    currentEditReport.value = rawStageReports.value
      .filter(item => formatDateOnly(item.reportDate) === todayText)
      .map(item => ({
        id: item.id,
        date: formatDateOnly(item.reportDate),
        pathStageId: item.pathStageId,
        stageName: resolveStageName(item.pathStageId),
        status: 'submitted' as const,
        content: item.content || '',
        plan: item.plan || '',
        problem: item.problem || '',
        remark: item.remark || '',
        updatedAt: item.updatedAt || item.createdAt || ''
      }))[0] || null;
    window.$message?.success('日报提交成功');
    closeReportModal();
  } finally {
    reportSubmitting.value = false;
  }
}

const mockCalendar = reactive<AssessmentPathDailyCalendarVo>({
  pathId: '',
  startDate: '',
  endDate: '',
  days: []
});

const assessmentActionText = computed(() => {
  if (currentStageEntity.value?.latestPaperId) {
    return '考核已生成';
  }
  if (currentStageEntity.value?.assessRequestedFlag) {
    return '已申请考核';
  }
  return '申请考核';
});

const assessmentActionDisabled = computed(() => {
  const stage = currentStageEntity.value;
  if (!stage?.id) return true;
  if (stage.latestPaperId) return true;
  if (stage.assessRequestedFlag) return true;
  return !['in_progress', 'failed'].includes(stage.status || '');
});

const currentStageStatusLabel = computed(() => resolveStageStatusLabel(currentStageEntity.value?.status));

resetWorkbenchData();

onMounted(() => {
  loadWorkbenchData();
});

async function loadWorkbenchData() {
  authStore.init();
  const userInfo = await authStore.loadUserInfo();
  const userId = userInfo?.userId || authStore.userInfo?.userId || '';

  if (!userId) {
    resetWorkbenchData();
    return;
  }

  const { data, error } = await fetchAssessmentPathList({
    pageNum: 1,
    pageSize: 200,
    userId,
    sortField: 'updatedAt',
    sortOrder: 'desc'
  });

  if (error) {
    resetWorkbenchData();
    return;
  }

  const selectedPath =
    (data?.records || []).find(item => ['in_progress', 'assess_requested', 'pending_review'].includes(item.status || ''))
    || (data?.records || [])[0]
    || null;

  if (!selectedPath?.id) {
    resetWorkbenchData();
    return;
  }

  const { data: detailData, error: detailError } = await fetchAssessmentPathById(selectedPath.id);
  if (detailError || !detailData) {
    resetWorkbenchData();
    return;
  }

  detail.value = detailData;
  currentStageEntity.value = resolveCurrentStage(detailData);
  currentStageStatusValue.value = currentStageEntity.value?.status || 'pending';

  const [stageResponse, reportResponse, calendarResponse] = await Promise.all([
    currentStageEntity.value?.stageId ? fetchAssessmentStageById(currentStageEntity.value.stageId) : Promise.resolve({ data: null, error: null }),
    currentStageEntity.value?.id ? fetchAssessmentPathStageDailyList(currentStageEntity.value.id) : Promise.resolve({ data: [], error: null }),
    detailData.id ? fetchAssessmentPathDailyCalendar(detailData.id) : Promise.resolve({ data: null, error: null })
  ]);

  stageDetail.value = stageResponse.error ? null : stageResponse.data || null;

  applyPathInfo(detailData);
  applyStages(detailData.stages || []);
  applyCurrentStage(currentStageEntity.value, stageDetail.value);
  applyLearningTasks(stageDetail.value?.materials || []);
  applyReports(reportResponse.error ? [] : reportResponse.data || []);
  applyCalendar(calendarResponse.error ? null : calendarResponse.data || null);
}

function resetWorkbenchData() {
  detail.value = null;
  currentStageEntity.value = null;
  stageDetail.value = null;
  showReportModal.value = false;
  showViewReportModal.value = false;
  showAssessmentModal.value = false;
  currentEditReport.value = null;
  currentViewReport.value = null;
  resetReportForm();
  resetAssessmentForm();
  userDisplayName.value = '学员';
  userGreeting.value = '当前暂无培训记录';
  currentStageStatusValue.value = 'pending';
  mockPathInfo.name = '暂无培训计划';
  mockPathInfo.startedAt = '-';
  mockPathInfo.expectedEndAt = '-';
  mockStages.splice(0, mockStages.length);
  mockCurrentStage.name = '暂无当前阶段';
  mockCurrentStage.status = '未开始';
  mockCurrentStage.studyDays = '未配置';
  mockCurrentStage.duration = '暂无进度';
  mockCurrentStage.startDate = '-';
  mockCurrentStage.description = '暂无阶段说明';
  mockCurrentStage.assessmentDescription = '暂无考核说明';
  mockLearningTasks.splice(0, mockLearningTasks.length);
  mockReports.splice(0, mockReports.length);
  rawStageReports.value = [];
  hasTodayReport.value = false;
  Object.assign(mockCalendar, {
    pathId: '',
    startDate: '',
    endDate: '',
    days: []
  });
}

function applyPathInfo(path: AssessmentInternPathVo) {
  userDisplayName.value = path.userName || authStore.userInfo?.username || '学员';
  userGreeting.value = '欢迎回来，继续加油！';
  mockPathInfo.name = path.templateName || '暂无培训计划';
  mockPathInfo.startedAt = formatDateOnly(path.trainingStartDate);
  mockPathInfo.expectedEndAt = formatDateOnly(path.trainingEndDate);
}

function applyStages(stages: AssessmentInternPathStageVo[]) {
  const nextStages = stages
    .slice()
    .sort((left, right) => (left.sort || 0) - (right.sort || 0))
    .map(stage => ({
      id: stage.id || stage.stageId || `${stage.sort || 0}`,
      name: stage.stageName || '未命名阶段',
      status: normalizeStageStatus(stage.status),
      progress: calculateStageProgress(stage),
      startedAt: toDisplayDate(stage.startedAt)
    }));
  mockStages.splice(0, mockStages.length, ...nextStages);
}

function applyCurrentStage(stage: AssessmentInternPathStageVo | null, stageInfo: AssessmentStageVo | null) {
  mockCurrentStage.name = stage?.stageName || detail.value?.currentStageName || '暂无当前阶段';
  mockCurrentStage.status = resolveStageStatusLabel(stage?.status);
  mockCurrentStage.studyDays = resolveStudyDaysText(stage);
  mockCurrentStage.duration = resolveStageDurationText(stage);
  mockCurrentStage.startDate = formatDateOnly(stage?.startedAt);
  mockCurrentStage.description = stageInfo?.description || '暂无阶段说明';
  mockCurrentStage.assessmentDescription = buildAssessmentMarkdown(stageInfo);
}

function applyLearningTasks(materials: AssessmentStageMaterialVo[]) {
  const nextMaterials = materials
    .slice()
    .sort((left, right) => (left.sort || 0) - (right.sort || 0))
    .map(item => ({
      title: item.title || '未命名资料',
      type: item.materialType || '学习资料',
      fileType: resolveMaterialFileType(item),
      url: item.materialUrl || ''
    }));
  mockLearningTasks.splice(0, mockLearningTasks.length, ...nextMaterials);
}

function applyReports(reports: AssessmentStageDailyReportVo[]) {
  rawStageReports.value = reports.slice();
  syncWorkbenchReports();
}

function applyCalendar(calendar: AssessmentPathDailyCalendarVo | null) {
  Object.assign(mockCalendar, {
    pathId: calendar?.pathId || '',
    startDate: calendar?.startDate || '',
    endDate: calendar?.endDate || '',
    days: calendar?.days || []
  });
  syncWorkbenchReports();
}

async function loadDailyReports(pathStageId: string) {
  const { data, error } = await fetchAssessmentPathStageDailyList(pathStageId);
  if (error) {
    return;
  }
  applyReports(data || []);
}

async function loadDailyCalendar(pathId: string) {
  const { data, error } = await fetchAssessmentPathDailyCalendar(pathId);
  if (error) {
    return;
  }
  applyCalendar(data || null);
}

function resolveCurrentStage(path: AssessmentInternPathVo) {
  const stages = (path.stages || []).slice().sort((left, right) => (left.sort || 0) - (right.sort || 0));
  const currentStageId = path.currentStageId || '';
  const lastResolvedStage = stages
    .slice()
    .reverse()
    .find(item => Boolean(item.status) && item.status !== 'pending');
  return (
    stages.find(item => item.status === 'pending_review')
    || stages.find(item => item.id === currentStageId || item.stageId === currentStageId)
    || stages.find(item => item.status === 'in_progress')
    || stages.find(item => item.status === 'failed')
    || lastResolvedStage
    || stages.find(item => item.status === 'pending')
    || stages[0]
    || null
  );
}

function resolveStageName(pathStageId?: string) {
  if (!pathStageId) return '';
  return (detail.value?.stages || []).find(item => item.id === pathStageId)?.stageName || '';
}

function normalizeStageStatus(status?: string | null) {
  if (!status) return 'pending';
  return status;
}

function syncWorkbenchReports() {
  const nextReports = (mockCalendar.days || [])
    .flatMap(day => (day.reports || []).map(report => ({
      id: report.id,
      date: formatDateOnly(report.reportDate),
      pathStageId: report.pathStageId,
      stageName: day.stageName || resolveStageName(report.pathStageId),
      status: 'submitted' as const,
      content: report.content || '',
      plan: report.plan || '',
      problem: report.problem || '',
      remark: report.remark || '',
      updatedAt: report.updatedAt || report.createdAt || ''
    })))
    .sort((left, right) => {
      if (left.date !== right.date) {
        return right.date.localeCompare(left.date);
      }
      return String(right.updatedAt || '').localeCompare(String(left.updatedAt || ''));
    });

  mockReports.splice(0, mockReports.length, ...nextReports);
  hasTodayReport.value = rawStageReports.value.some(item => formatDateOnly(item.reportDate) === todayText);
}

function calculateStageProgress(stage: AssessmentInternPathStageVo) {
  if (stage.status === 'passed') return 100;
  if (stage.status === 'failed') return 0;
  if (stage.status === 'in_progress' || stage.status === 'pending_review') {
    if (!stage.startedAt || !stage.minStudyDays) return 50;
    const startedAt = new Date(stage.startedAt);
    const current = new Date();
    const diffDays = Math.max(0, Math.floor((current.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24)));
    return Math.max(10, Math.min(95, Math.round((diffDays / stage.minStudyDays) * 100)));
  }
  return 0;
}

function resolveStageStatusLabel(status?: string | null) {
  if (status === 'passed') return '已完成';
  if (status === 'failed') return '未通过';
  if (status === 'pending_review') return '待考核';
  if (status === 'in_progress') return '进行中';
  return '未开始';
}

function resolveStudyDaysText(stage?: AssessmentInternPathStageVo | null) {
  if (!stage) return '未配置';
  if (stage.minStudyDays != null && stage.maxStudyDays != null) return `${stage.minStudyDays}-${stage.maxStudyDays}天`;
  if (stage.minStudyDays != null) return `${stage.minStudyDays}天起`;
  if (stage.maxStudyDays != null) return `${stage.maxStudyDays}天内`;
  return '未配置';
}

function resolveStageDurationText(stage?: AssessmentInternPathStageVo | null) {
  if (!stage) return '暂无进度';
  if (stage.studyDurationDays != null) return `已进行 ${stage.studyDurationDays} 天`;
  if (stage.startedAt) {
    const startedAt = new Date(stage.startedAt);
    const current = new Date();
    const diffDays = Math.max(1, Math.floor((current.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    return `已进行 ${diffDays} 天`;
  }
  return '未开始';
}

function buildAssessmentMarkdown(stage?: AssessmentStageVo | null) {
  if (!stage) return '暂无考核说明';

  const lines: string[] = ['## 阶段考核说明'];
  if (stage.passScore != null) lines.push('', `- 通过分数：${stage.passScore}`);
  if (stage.passRemark) lines.push('', '### 通过说明', '', stage.passRemark);

  const rules = (stage.rules || []).slice().sort((left, right) => (left.sort || 0) - (right.sort || 0));
  if (rules.length) {
    lines.push('', '### 考核规则');
    rules.forEach((rule, index) => {
      lines.push(`${index + 1}. **${rule.questionType || '考核'}**`);
      if (rule.difficulty) lines.push(`   - 难度：${rule.difficulty}`);
      if (rule.knowledgePoints) lines.push(`   - 知识范围：${rule.knowledgePoints}`);
      if (rule.questionCount != null) lines.push(`   - 题量：${rule.questionCount}`);
      if (rule.score != null) lines.push(`   - 分值：${rule.score}`);
    });
  }

  return lines.join('\n') || '暂无考核说明';
}

function resolveMaterialFileType(material: AssessmentStageMaterialVo) {
  const materialType = (material.materialType || '').toLowerCase();
  const url = material.materialUrl || '';
  if (materialType.includes('视频') || /\.(mp4|avi|mov|mkv)$/i.test(url)) return 'video';
  if (materialType.includes('音频') || /\.(mp3|wav|aac)$/i.test(url)) return 'audio';
  if (/\.(ppt|pptx)$/i.test(url)) return 'ppt';
  if (/\.pdf$/i.test(url)) return 'pdf';
  return 'doc';
}

function toDisplayDate(value?: string | null) {
  const formatted = formatDateOnly(value);
  return formatted === '-' ? null : formatted;
}

function formatDateOnly(value?: string | Date | null) {
  if (!value) return '-';
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return String(value).slice(0, 10) || '-';
}

function openAssessmentAction() {
  const stage = currentStageEntity.value;
  if (!stage?.id) {
    window.$message?.warning('当前暂无可申请考核的培训阶段');
    return;
  }

  if (stage.latestPaperId || stage.assessRequestedFlag) {
    return;
  }

  if (!['in_progress', 'failed'].includes(stage.status || '')) {
    window.$message?.warning('当前阶段状态不允许申请考核');
    return;
  }

  assessmentForm.reason = stage.assessRequestReason || '';
  showAssessmentModal.value = true;
}

function closeAssessmentModal() {
  showAssessmentModal.value = false;
  resetAssessmentForm();
}

async function handleSubmitAssessment() {
  if (!currentStageEntity.value?.id) {
    window.$message?.warning('当前暂无可申请考核的培训阶段');
    return;
  }
  const { error } = await fetchAssessmentPathStageAssessRequest({
    pathStageId: currentStageEntity.value.id,
    assessRequestReason: String(assessmentForm.reason || '').trim() || undefined
  });
  if (error) {
    return;
  }
  window.$message?.success('考核申请已提交，请等待导师出题');
  closeAssessmentModal();
  await loadWorkbenchData();
}

function openAchievementUpload() {
  if (!currentStageEntity.value?.id) {
    window.$message?.warning('当前暂无可上传成果的培训阶段');
    return;
  }
  if (currentStageAchievementSubmitted.value) {
    window.$message?.warning('当前阶段成果材料已完成提交，不能继续上传');
    return;
  }
  if (!canUploadCurrentStageAchievement.value) {
    window.$message?.warning('请等待阅卷结束后再上传成果');
    return;
  }
  pendingAchievementFile.value = null;
  achievementForm.remark = '';
  showAchievementModal.value = true;
}

function closeAchievementModal() {
  showAchievementModal.value = false;
  pendingAchievementFile.value = null;
  achievementForm.remark = '';
  if (achievementInputRef.value) achievementInputRef.value.value = '';
}

async function resolveAchievementStorageConfigId() {
  const { data, error } = await fetchStorageConfigOptions('attachment');
  if (!error && data?.length) {
    const preferred = data.find(item => item.defaultFlag) || data[0];
    if (preferred?.id) return preferred.id;
  }
  const fallback = await fetchStorageConfigOptions();
  if (!fallback.error && fallback.data?.length) {
    const preferred = fallback.data.find(item => item.defaultFlag) || fallback.data[0];
    return preferred?.id || '';
  }
  return '';
}

async function handleAchievementFileChange(event: Event) {
  const file = (event.target as HTMLInputElement | null)?.files?.[0];
  if (!file) {
    if (achievementInputRef.value) achievementInputRef.value.value = '';
    return;
  }
  pendingAchievementFile.value = file;
}

async function handleSubmitAchievement() {
  if (currentStageAchievementSubmitted.value) {
    window.$message?.warning('当前阶段成果材料已完成提交，不能继续上传');
    return;
  }
  if (!canUploadCurrentStageAchievement.value) {
    window.$message?.warning('请等待阅卷结束后再上传成果');
    return;
  }
  const file = pendingAchievementFile.value;
  if (!file || !currentStageEntity.value?.id || !detail.value?.id) {
    window.$message?.warning('请先选择要上传的成果文件');
    return;
  }
  achievementUploading.value = true;
  try {
    const storageConfigId = await resolveAchievementStorageConfigId();
    if (!storageConfigId) {
      window.$message?.error('未找到可用的文件存储配置');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('storageGroup', 'attachment');
    formData.append('storageConfigId', storageConfigId);
    formData.append('remark', String(achievementForm.remark || '').trim() || '学员工作台成果材料上传');

    const { data, error, msg } = await fetchFileRecordUpload(formData);
    if (error || !data?.id) return;

    const { error: saveError } = await fetchAssessmentPathStageAchievementSave({
      pathId: detail.value.id,
      pathStageId: currentStageEntity.value.id,
      userId: detail.value.userId,
      stageId: currentStageEntity.value.stageId,
      stageName: currentStageEntity.value.stageName,
      fileId: data.id,
      fileName: data.fileName || file.name,
      fileUrl: data.fileUrl,
      remark: String(achievementForm.remark || '').trim() || undefined
    });
    if (saveError) return;

    window.$message?.success(msg || '成果上传成功');
    closeAchievementModal();
    await loadWorkbenchData();
  } finally {
    achievementUploading.value = false;
    if (achievementInputRef.value) achievementInputRef.value.value = '';
  }
}

function handleSubmitAchievementComplete() {
  if (!currentStageEntity.value?.id) {
    window.$message?.warning('当前暂无可提交成果的培训阶段');
    return;
  }
  if (currentStageAchievementSubmitted.value) {
    window.$message?.warning('当前阶段成果材料已完成提交');
    return;
  }
  if (!canSubmitCurrentStageAchievement.value) {
    window.$message?.warning('请先上传成果材料后再完成提交');
    return;
  }
  window.$dialog?.warning({
    title: '完成提交',
    content: '提交后当前阶段成果材料将锁定，不能继续上传或删除。确认提交吗？',
    positiveText: '确认提交',
    negativeText: '取消',
    onPositiveClick: async () => {
      achievementSubmitLoading.value = true;
      try {
        const { error } = await fetchAssessmentPathStageAchievementSubmit({
          pathStageId: currentStageEntity.value!.id
        });
        if (error) return false;
        window.$message?.success('成果材料已提交');
        await loadWorkbenchData();
        return true;
      } finally {
        achievementSubmitLoading.value = false;
      }
    }
  });
}

function resetReportForm() {
  reportForm.content = '';
  reportForm.plan = '';
}

function resetAssessmentForm() {
  assessmentForm.reason = '';
}

function fillReportForm(report: WorkbenchReportItem | null) {
  if (!report) {
    resetReportForm();
    return;
  }
  reportForm.content = report.content || '';
  reportForm.plan = report.plan || '';
}

function openMaterial(url?: string) {
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
}

function openAchievementFile(item: AssessmentStageAchievementVo) {
  if (!item.fileUrl) {
    window.$message?.warning('当前材料没有可访问地址');
    return;
  }
  window.open(item.fileUrl, '_blank', 'noopener,noreferrer');
}

function handleDeleteAchievement(item: AssessmentStageAchievementVo) {
  if (!item.id) return;
  if (currentStageAchievementSubmitted.value) {
    window.$message?.warning('当前阶段成果材料已完成提交，不能删除');
    return;
  }
  if (!canDeleteCurrentStageAchievement.value) {
    window.$message?.warning('当前阶段已结束，不能删除成果材料');
    return;
  }
  window.$dialog?.warning({
    title: '删除成果',
    content: `确认删除成果材料【${item.fileName || '未命名文件'}】吗？`,
    positiveText: '确认删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      deletingAchievementId.value = item.id || '';
      const { error } = await fetchAssessmentPathStageAchievementDelete(item.id!);
      try {
        if (error) return false;
        window.$message?.success('成果材料已删除');
        await loadWorkbenchData();
        return true;
      } finally {
        deletingAchievementId.value = '';
      }
    }
  });
}

function handleMarkdownPreviewClick(event: MouseEvent) {
  const target = event.target as HTMLElement | null;
  const image = target?.closest('img') as HTMLImageElement | null;
  if (!image?.src) {
    return;
  }

  previewImageSrc.value = image.src;
  showImagePreview.value = true;
}

function getDifficultyTagType(difficulty: string): 'success' | 'warning' | 'error' | 'default' {
  if (difficulty === '简单') return 'success';
  if (difficulty === '中等') return 'warning';
  if (difficulty === '困难') return 'error';
  return 'default';
}
</script>

<template>
  <InfoPageLayout>
    <template #contentBox>
      <div class="workbench-layout">
        <!-- 顶部区域 -->
        <div class="workbench-top">
          <!-- 用户信息卡片 -->
          <div class="user-welcome-card">
            <div class="user-welcome-card__avatar">
              <span>{{ userDisplayName.slice(0, 1) || '学' }}</span>
            </div>
            <div class="user-welcome-card__info">
              <div class="user-welcome-card__name">{{ userDisplayName }}</div>
              <div class="user-welcome-card__greeting">{{ userGreeting }}</div>
            </div>
          </div>

          <!-- 阶段进度条 - 节点加轴形式 -->
          <div class="stages-progress-card">
            <div class="stages-progress-card__left">
              <div class="stages-progress-card__title-row">
                <span class="stages-progress-card__title">{{ mockPathInfo.name }}</span>
                <span class="stages-progress-card__dates">
                  <span class="date-chip">{{ mockPathInfo.startedAt }}</span>
                  <span class="date-separator">—</span>
                  <span class="date-chip">{{ mockPathInfo.expectedEndAt }}</span>
                </span>
              </div>
              <div class="stages-timeline">
                <!-- 开始节点 -->
                <NTooltip trigger="hover">
                  <template #trigger>
                    <span :style="getBoundaryDotStyle(true, mockStages.some(s => s.status !== 'pending'))"></span>
                  </template>
                  开始
                </NTooltip>
                <span :style="getBoundaryLineStyle(mockStages.some(s => s.status !== 'pending'))"></span>

                <!-- 阶段节点 -->
                <template v-for="(stage, index) in mockStages" :key="stage.id">
                  <NTooltip trigger="hover">
                    <template #trigger>
                      <span :style="getStageDotStyle(stage)"></span>
                    </template>
                    <div class="stage-tooltip">
                      <div class="stage-tooltip__name">{{ stage.name }}</div>
                      <div class="stage-tooltip__status">{{ resolveStageStatusLabel(stage.status) }}</div>
                      <div v-if="stage.startedAt" class="stage-tooltip__date">开始于 {{ stage.startedAt }}</div>
                    </div>
                  </NTooltip>
                  <span v-if="index < mockStages.length - 1" :style="getStageLineStyle(mockStages[index + 1])"></span>
                </template>

                <!-- 结束节点 -->
                <span :style="getBoundaryLineStyle(mockStages.every(s => s.status === 'passed'))"></span>
                <NTooltip trigger="hover">
                  <template #trigger>
                    <span :style="getBoundaryDotStyle(false, mockStages.every(s => s.status === 'passed'))"></span>
                  </template>
                  结束
                </NTooltip>
              </div>
            </div>
            <div class="stages-progress-card__right">
              <span class="date-chip stages-progress-card__duration">{{ mockCurrentStage.duration }}</span>
              <NButton type="primary" size="small" :disabled="assessmentActionDisabled" @click="openAssessmentAction">{{
                assessmentActionText }}</NButton>
            </div>
          </div>
        </div>

        <!-- 主体区域 -->
        <div class="workbench-body">
          <!-- 左侧主内容 -->
          <div class="workbench-main">
            <!-- 当前阶段信息 -->
            <div class="content-card current-stage-card">
              <div class="content-card__header">
                <div class="content-card__title">{{ mockCurrentStage.name }}</div>
                <div class="stage-header-tags">
                  <span class="date-chip">预计完成：{{ mockCurrentStage.studyDays }}</span>
                  <DictTag dict-code="assessment_path_stage_status" :value="currentStageStatusValue"
                    :override-label="currentStageStatusLabel" />
                </div>
              </div>
              <div class="content-card__body">
                <div class="stage-description">
                  <div class="stage-description__item">
                    <div class="stage-description__label">阶段说明</div>
                    <div class="stage-description__text markdown-body"
                      v-html="renderMarkdown(mockCurrentStage.description)" @click="handleMarkdownPreviewClick">
                    </div>
                  </div>
                  <div class="stage-description__item">
                    <div class="stage-description__label">考核说明</div>
                    <div class="stage-description__text markdown-body"
                      v-html="renderMarkdown(mockCurrentStage.assessmentDescription)"
                      @click="handleMarkdownPreviewClick"></div>
                  </div>
                </div>

                <!-- 阶段资料 -->
                <div class="stage-materials">
                  <div class="stage-materials__label">阶段资料</div>
                  <div class="stage-materials__list">
                    <div v-for="task in mockLearningTasks" :key="task.title" class="stage-material-item">
                      <span class="stage-material-item__icon">
                        <svg v-if="task.fileType === 'video'" width="14" height="14" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" stroke-width="2">
                          <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                          stroke-width="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                      </span>
                      <span class="stage-material-item__title">{{ task.title }}</span>
                      <NTag size="tiny" :bordered="false" type="info">{{ task.type }}</NTag>
                      <NButton v-if="isMultimedia(task.fileType)" size="tiny" type="primary"
                        @click="openMaterial(task.url)">
                        播放
                      </NButton>
                      <NButton v-else size="tiny" type="default" @click="openMaterial(task.url)">
                        下载
                      </NButton>
                    </div>
                  </div>
                </div>

                <div class="stage-materials">
                  <div class="stage-materials__header">
                    <div class="stage-materials__label">成果材料</div>
                    <div class="stage-materials__actions">
                      <NTag size="tiny" :bordered="false" :type="currentStageAchievementRequired ? 'warning' : 'default'">
                        {{ currentStageAchievementRequired ? '必传' : '非必传' }}
                      </NTag>
                      <NTag size="tiny" :bordered="false" :type="currentStageAchievementStatusType">
                        {{ currentStageAchievementStatusText }}
                      </NTag>
                      <NButton
                        size="tiny"
                        type="primary"
                        :loading="achievementUploading"
                        :disabled="!canUploadCurrentStageAchievement"
                        @click="openAchievementUpload"
                      >
                        上传成果
                      </NButton>
                      <NButton
                        size="tiny"
                        secondary
                        type="primary"
                        :loading="achievementSubmitLoading"
                        :disabled="!canSubmitCurrentStageAchievement"
                        @click="handleSubmitAchievementComplete"
                      >
                        完成提交
                      </NButton>
                    </div>
                  </div>
                  <div v-if="currentStageAchievements.length" class="stage-materials__list">
                    <div v-for="item in currentStageAchievements" :key="item.id || item.fileId" class="stage-material-item">
                      <span class="stage-material-item__icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                      </span>
                      <span class="stage-material-item__title">{{ item.fileName || '未命名文件' }}</span>
                      <NTag size="tiny" :bordered="false" type="success">成果</NTag>
                      <NButton size="tiny" type="default" @click="openAchievementFile(item)">
                        查看
                      </NButton>
                      <NButton
                        v-if="canDeleteCurrentStageAchievement"
                        size="tiny"
                        type="error"
                        quaternary
                        :loading="deletingAchievementId === item.id"
                        @click="handleDeleteAchievement(item)"
                      >
                        删除
                      </NButton>
                    </div>
                  </div>
                  <div v-else class="stage-materials__empty">
                    {{ currentStageAchievementRequired ? '当前阶段要求上传成果材料，暂未上传' : '当前阶段暂无成果材料' }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧边栏 -->
          <div class="workbench-sidebar">
            <!-- 日历 -->
            <div class="content-card content-card--calendar">
              <div class="content-card__header">
                <div class="content-card__title">日历</div>
              </div>
              <div class="content-card__body">
                <WorkbenchDailyCalendar :calendar="mockCalendar" />
              </div>
            </div>

            <!-- 日报列表 -->
            <div class="content-card">
              <div class="content-card__header">
                <div class="content-card__title">日报</div>
                <NButton v-if="hasTodayReport" size="tiny" type="primary" @click="openReportModal">修改日报</NButton>
                <NButton v-else size="tiny" type="primary" @click="openReportModal">新增日报</NButton>
              </div>
              <div class="content-card__body">
                <div class="report-list">
                  <div v-for="report in mockReports" :key="report.id || `${report.date}-${report.pathStageId || report.stageName || ''}`" class="report-item"
                    @click="openViewReportModal(report)">
                    <div class="report-item__header">
                      <div class="report-item__header-main">
                        <span class="report-item__date">{{ report.date }}</span>
                        <NTag v-if="report.stageName" size="tiny" :bordered="false" type="info">{{ report.stageName }}</NTag>
                      </div>
                      <DictTag dict-code="assessment_daily_report_status" :value="report.status || 'submitted'"
                        :override-label="'已提交'" />
                    </div>
                    <div class="report-item__content">
                      <div class="report-item__line">
                        <span class="report-item__label">内容</span>
                        <span class="report-item__text">{{ report.content || '当日未提交日报' }}</span>
                      </div>
                    </div>
                  </div>
                  <div v-if="!mockReports.length" class="report-list__empty">暂无已提交日报</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </InfoPageLayout>

  <!-- 修改日报弹窗 -->
  <NModal v-model:show="showReportModal" preset="card" :title="hasTodayReport ? '修改日报' : '新增日报'"
    :style="{ width: '80%' }">
    <div class="report-modal-form">
      <div class="form-field form-field--large">
        <div class="form-field__label">内容</div>
        <MarkdownEditor v-model:value="reportForm.content" placeholder="填写今日学习和完成情况（支持Markdown语法）" />
      </div>
    </div>
    <template #action>
      <div class="em-dialog-actions">
        <NButton :disabled="reportSubmitting" @click="closeReportModal">取消</NButton>
        <NButton type="primary" :loading="reportSubmitting" @click="handleSubmitReport">提交</NButton>
      </div>
    </template>
  </NModal>

  <!-- 查看日报弹窗 -->
  <NModal v-model:show="showAssessmentModal" preset="card" title="申请考核" :style="{ width: '420px' }">
    <div class="form-field">
      <div class="form-field__label">申请说明</div>
      <NInput v-model:value="assessmentForm.reason" type="textarea" placeholder="填写本阶段学习完成情况、申请原因等"
        :autosize="{ minRows: 4, maxRows: 6 }" />
    </div>
    <template #action>
      <div class="em-dialog-actions">
        <NButton @click="closeAssessmentModal">取消</NButton>
        <NButton type="primary" @click="handleSubmitAssessment">提交申请</NButton>
      </div>
    </template>
  </NModal>

  <NModal v-model:show="showAchievementModal" preset="card" title="上传成果" :style="{ width: '520px' }">
    <div class="report-modal-form">
      <div class="form-field">
        <div class="form-field__label">成果文件</div>
        <div class="achievement-form-file">
          <input ref="achievementInputRef" type="file" class="achievement-upload-input" @change="handleAchievementFileChange">
          <NButton size="small" type="primary" secondary @click="achievementInputRef?.click()">
            选择文件
          </NButton>
          <span class="achievement-form-file__name">{{ pendingAchievementFile?.name || '未选择文件' }}</span>
        </div>
      </div>
      <div class="form-field">
        <div class="form-field__label">备注</div>
        <NInput
          v-model:value="achievementForm.remark"
          type="textarea"
          placeholder="请填写成果说明、版本信息或补充备注"
          :autosize="{ minRows: 3, maxRows: 5 }"
        />
      </div>
    </div>
    <template #action>
      <div class="em-dialog-actions">
        <NButton :disabled="achievementUploading" @click="closeAchievementModal">取消</NButton>
        <NButton type="primary" :loading="achievementUploading" @click="handleSubmitAchievement">提交上传</NButton>
      </div>
    </template>
  </NModal>

  <NModal v-model:show="showViewReportModal" preset="card" :title="currentViewReport?.date + ' 日报'"
    :style="{ width: '80%' }" :mask-closable="true">
    <div class="report-modal-form">
      <div class="form-field form-field--large">
        <MarkdownEditor v-model:value="currentViewReportContent" preview-only />
      </div>
    </div>
    <template #action>
      <div class="em-dialog-actions">
        <NButton @click="closeViewReportModal">关闭</NButton>
      </div>
    </template>
  </NModal>

  <NImagePreview v-model:show="showImagePreview" :src="previewImageSrc" show-toolbar show-toolbar-tooltip />

</template>

<style scoped lang="scss">
.workbench-layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  min-height: 0;
}

// 顶部区域
.workbench-top {
  display: flex;
  gap: 16px;
  align-items: stretch;
  flex-shrink: 0;
}

.user-welcome-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 20px;
  border-radius: 14px;
  background: rgb(var(--container-bg-color));
  box-shadow:
    inset 0 0 0 1px rgb(var(--border-color)),
    0 1px 2px rgb(31 35 41 / 4%);
}

.user-welcome-card__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgb(var(--em-primary-color-rgb) / 0.15);
  color: var(--em-primary-color);
  font-size: 18px;
  font-weight: 600;
}

.user-welcome-card__info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-welcome-card__name {
  color: var(--n-text-color-1);
  font-size: 16px;
  font-weight: 600;
}

.user-welcome-card__greeting {
  color: var(--n-text-color-3);
  font-size: 12px;
}

// 阶段进度条卡片 - 时间线样式
.stages-progress-card {
  flex: 1;
  display: flex;
  gap: 16px;
  padding: 14px 16px;
  border-radius: 14px;
  background: rgb(var(--container-bg-color));
  box-shadow:
    inset 0 0 0 1px rgb(var(--border-color)),
    0 1px 2px rgb(31 35 41 / 4%);
  overflow-x: auto;

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgb(var(--border-color));
    border-radius: 2px;
  }
}

.stages-progress-card__left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.stages-progress-card__right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.stages-progress-card__title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.stages-progress-card__title {
  color: var(--n-text-color-1);
  font-size: 14px;
  font-weight: 600;
}

.stages-progress-card__dates {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--n-text-color-3);
  font-size: 12px;
}

.date-chip {
  padding: 2px 8px;
  border-radius: 4px;
  background: rgb(var(--em-primary-color-rgb) / 10%);
  color: var(--em-primary-color);
  font-size: 11px;
  font-weight: 500;
}

.date-separator {
  color: var(--n-text-color-3);
}

.stages-progress-card__duration {
  color: var(--n-text-color-2);
  font-size: 12px;
  font-weight: 500;
}

.stages-timeline {
  display: inline-flex;
  align-items: center;
  gap: 0;
}

// 阶段提示框样式
.stage-tooltip {
  padding: 4px 0;
}

.stage-tooltip__name {
  color: var(--n-text-color-1);
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 2px;
}

.stage-tooltip__status {
  color: var(--n-text-color-2);
  font-size: 11px;
}

.stage-tooltip__date {
  color: var(--n-text-color-3);
  font-size: 10px;
  margin-top: 2px;
}

// 主体区域
.workbench-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 16px;
  flex: 1;
  min-height: 0;
  align-items: stretch;
}

.workbench-main {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;

  >.content-card {
    flex-shrink: 0;
  }

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgb(var(--border-color));
    border-radius: 3px;
  }
}

.workbench-sidebar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 300px;
  flex-shrink: 0;
  min-height: 0;
  height: 100%;
  overflow: hidden;

  >.content-card {
    &:first-child {
      flex-shrink: 0;
    }

    &:last-child {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
  }
}

// 内容卡片 - 统一样式
.content-card {
  flex-shrink: 0;
  border-radius: 14px;
  background: rgb(var(--container-bg-color));
  box-shadow:
    inset 0 0 0 1px rgb(var(--border-color)),
    0 1px 2px rgb(31 35 41 / 4%);
}

.current-stage-card {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.content-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid rgb(var(--border-color) / 60%);
}

.content-card__title {
  color: var(--n-text-color-1);
  font-size: 14px;
  font-weight: 600;
}

.stage-header-tags {
  display: flex;
  align-items: center;
  gap: 8px;
}

.content-card__body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 12px 16px;
  box-sizing: border-box;
  overflow: hidden;
}

// 侧边栏卡片
.workbench-sidebar {
  >.content-card:last-child {
    .content-card__body {
      flex: 1;
      overflow: hidden;
    }

    .report-list {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
    }
  }
}

// 阶段说明
.stage-description {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
  flex: 1;
  min-height: 0;
}

.stage-description__item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  border-radius: 10px;
  background: rgb(var(--layout-bg-color));
  box-shadow: inset 0 0 0 1px rgb(var(--border-color) / 60%);
  min-height: 0;
  flex: 1;
}

.stage-description__label {
  color: var(--n-text-color-1);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  flex-shrink: 0;
}

.stage-description__text {
  flex: 1;
  min-height: 0;
  padding: 12px;
  border-radius: 8px;
  background: rgb(var(--container-bg-color));
  box-shadow: inset 0 0 0 1px rgb(var(--border-color) / 48%);
  color: var(--n-text-color-2);
  font-size: 13px;
  line-height: 1.5;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgb(var(--border-color));
    border-radius: 2px;
  }

  :deep(h1) {
    font-size: 16px;
    font-weight: 600;
    color: var(--n-text-color-1);
    margin-bottom: 8px;
    border-bottom: 1px solid rgb(var(--border-color) / 40%);
    padding-bottom: 4px;
  }

  :deep(h2) {
    font-size: 14px;
    font-weight: 600;
    color: var(--n-text-color-1);
    margin-bottom: 6px;
    margin-top: 10px;
  }

  :deep(h3) {
    font-size: 13px;
    font-weight: 600;
    color: var(--n-text-color-1);
    margin-bottom: 4px;
    margin-top: 8px;
  }

  :deep(h4) {
    font-size: 12px;
    font-weight: 600;
    color: var(--n-text-color-1);
    margin-bottom: 3px;
    margin-top: 6px;
  }

  :deep(p) {
    margin-bottom: 6px;
  }

  :deep(ul),
  :deep(ol) {
    margin-bottom: 6px;
    padding-left: 18px;
  }

  :deep(li) {
    margin-bottom: 2px;
  }

  :deep(strong) {
    font-weight: 600;
    color: var(--n-text-color-1);
  }

  :deep(em) {
    font-style: italic;
  }

  :deep(code) {
    padding: 1px 5px;
    border-radius: 3px;
    background: rgb(var(--layout-bg-color));
    font-family: monospace;
    font-size: 11px;
    color: var(--em-primary-color);
  }

  :deep(pre) {
    padding: 8px;
    border-radius: 6px;
    background: rgb(var(--layout-bg-color));
    overflow-x: auto;
    margin-bottom: 6px;

    code {
      padding: 0;
      background: none;
    }
  }

  :deep(blockquote) {
    margin: 6px 0;
    padding: 6px 10px;
    border-left: 3px solid var(--em-primary-color);
    background: rgb(var(--layout-bg-color));
    color: var(--n-text-color-3);
  }

  :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 8px;
    font-size: 11px;
  }

  :deep(th),
  :deep(td) {
    padding: 4px 8px;
    border: 1px solid rgb(var(--border-color) / 60%);
    text-align: left;
  }

  :deep(th) {
    background: rgb(var(--layout-bg-color));
    font-weight: 600;
  }

  :deep(hr) {
    border: none;
    border-top: 1px solid rgb(var(--border-color) / 60%);
    margin: 8px 0;
  }

  :deep(img) {
    max-width: 100%;
    border-radius: 8px;
    cursor: zoom-in;
    transition: opacity 0.2s ease;
  }

  :deep(img:hover) {
    opacity: 0.92;
  }
}

// 阶段资料
.stage-materials {
  margin-top: 12px;
  padding: 12px;
  border-radius: 10px;
  background: rgb(var(--layout-bg-color));
  box-shadow: inset 0 0 0 1px rgb(var(--border-color) / 60%);
  flex-shrink: 0;
}

.stage-materials__label {
  color: var(--n-text-color-1);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  margin-bottom: 10px;
}

.stage-materials__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.stage-materials__header .stage-materials__label {
  margin-bottom: 0;
}

.stage-materials__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.achievement-upload-input {
  display: none;
}

.achievement-form-file {
  display: flex;
  align-items: center;
  gap: 12px;
}

.achievement-form-file__name {
  min-width: 0;
  flex: 1;
  color: var(--n-text-color-3);
  font-size: 13px;
  word-break: break-all;
}

.stage-materials__list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stage-material-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgb(var(--container-bg-color));
  text-decoration: none;
  transition: background 0.15s ease;

  &:hover {
    background: rgb(var(--border-color) / 50%);
  }
}

.stage-material-item__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--em-primary-color);
}

.stage-material-item__title {
  flex: 1;
  color: var(--n-text-color-1);
  font-size: 13px;
}

.stage-materials__empty {
  padding: 10px 12px;
  border-radius: 8px;
  background: rgb(var(--container-bg-color));
  color: var(--n-text-color-3);
  font-size: 13px;
  box-shadow: inset 0 0 0 1px rgb(var(--border-color) / 60%);
}

// 任务列表
.task-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgb(var(--layout-bg-color));

  &--material {
    border-left: 3px solid rgb(var(--em-primary-color-rgb) / 0.6);
  }

  &--assessment {
    border-left: 3px solid rgb(208 48 80 / 0.5);
  }
}

.task-item__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.task-item__header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.task-item__title {
  color: var(--n-text-color-1);
  font-size: 13px;
  font-weight: 500;
}

.task-item__meta {
  display: flex;
  gap: 12px;
  color: var(--n-text-color-3);
  font-size: 11px;
}

// 阶段说明 - 双栏布局
.description-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  flex: 1;
  min-height: 0;

  >.content-card {
    display: flex;
    flex-direction: column;
    min-height: 0;

    .content-card__body {
      // flex: 1;
      height: 100px;
      min-height: 0;
      overflow-y: auto;
    }
  }
}

.description-text {
  color: var(--n-text-color-2);
  font-size: 13px;
  line-height: 1.6;
}

// 日报列表
.report-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgb(var(--border-color));
    border-radius: 2px;
  }
}

.report-list__empty {
  padding: 18px 12px;
  border-radius: 8px;
  background: rgb(var(--layout-bg-color));
  box-shadow: inset 0 0 0 1px rgb(var(--border-color) / 60%);
  color: var(--n-text-color-3);
  font-size: 13px;
  text-align: center;
}

.report-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgb(var(--layout-bg-color));
  flex-shrink: 0;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: rgb(var(--border-color) / 50%);
  }
}

.report-item__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.report-item__header-main {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.report-item__date {
  color: var(--n-text-color-1);
  font-size: 12px;
  font-weight: 600;
}

.report-item__status {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgb(82 196 26 / 15%);
  color: rgb(82 196 26);
  font-size: 11px;
  font-weight: 500;
}

.report-item__content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.report-item__line {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  gap: 6px;
  align-items: start;
}

.report-item__label {
  color: var(--n-text-color-3);
  font-size: 10px;
}

.report-item__text {
  color: var(--n-text-color-2);
  font-size: 11px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

// 响应式
@media (width <=1180px) {
  .workbench-body {
    grid-template-columns: 1fr;
  }

  .workbench-sidebar {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;

    >.content-card {
      flex: 1 1 280px;
    }
  }
}

@media (width <=960px) {
  .workbench-top {
    flex-direction: column;
  }

  .user-welcome-card {
    padding: 12px 16px;
  }

  .stages-progress-card {
    gap: 10px;
  }

  .stage-progress-item {
    flex: 0 0 140px;
  }
}
</style>

<!-- 日报弹窗样式 -->
<style lang="scss">
.report-modal-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &--large {
    height: 800px;

    :deep(.markdown-editor) {
      height: 100%;
    }
  }
}

.form-field__label {
  color: var(--n-text-color-2);
  font-size: 13px;
  font-weight: 500;
}

.report-modal-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 70vh;
  overflow-y: auto;
}
</style>
