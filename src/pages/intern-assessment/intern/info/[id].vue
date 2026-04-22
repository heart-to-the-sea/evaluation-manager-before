<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { ArrowBackOutline, ChevronDownOutline, ChevronForwardOutline } from '@vicons/ionicons5';
import { NButton, NDatePicker, NEmpty, NIcon, NInput, NInputNumber, NModal, NSpin, NSwitch, NTabPane, NTabs, NTag } from 'naive-ui';
import DictTag from '@/components/common/DictTag.vue';
import DictSelect from '@/components/common/DictSelect.vue';
import InfoGridCard from '@/components/common/InfoGridCard.vue';
import PaperCreateDialog from '@/components/features/intern-assessment/PaperCreateDialog.vue';
import PaperInfoModal from '@/components/features/intern-assessment/PaperInfoModal.vue';
import PathDailyCalendar from '@/components/features/intern-assessment/PathDailyCalendar.vue';
import InfoPageLayout from '@/components/pages/InfoPageLayout.vue';
import {
  fetchAssessmentFinalReviewLinkCreate,
  fetchAssessmentPathEnd,
  fetchAssessmentFinalTemplateById,
  fetchAssessmentPathFinalReview,
  fetchAssessmentPaperList,
  fetchAssessmentPathById,
  fetchAssessmentPathDailyCalendar,
  fetchAssessmentPathExitList,
  fetchAssessmentPathExitSave,
  fetchAssessmentPathStageEnd,
  fetchAssessmentPathStageStart,
  fetchAssessmentPathViolationList,
  fetchAssessmentPathViolationSave,
  fetchUserById
} from '@/service/api';
import type {
  AssessmentExitRecordVo,
  AssessmentFinalTemplateVo,
  AssessmentInternPathStageVo,
  AssessmentInternPathVo,
  AssessmentPathDailyCalendarDayVo,
  AssessmentPathDailyCalendarVo,
  AssessmentPaperVo,
  AssessmentViolationRecordVo,
  UserOptionVo,
  UserVo
} from '@/types/app';
import {
  getAssessmentDailyReportStatusLabel,
  getAssessmentPassResultLabel,
  resolveAssessmentPassResult
} from '@/utils/assessment-dict';

definePageMeta({
  title: '培训详情'
});

const route = useRoute();

const loading = ref(false);
const showAssessDialog = ref(false);
const showPaperDialog = ref(false);
const showStageEndDialog = ref(false);
const showFinalReviewDialog = ref(false);
const showViolationDialog = ref(false);
const showExitDialog = ref(false);
const showRetainDialog = ref(false);
const activePaperId = ref<string | null>(null);
const activePaperReadonly = ref(true);
const assessStage = ref<AssessmentInternPathStageVo | null>(null);
const actionLoadingStageId = ref('');
const endingStage = ref<AssessmentInternPathStageVo | null>(null);
const editingViolationStage = ref<AssessmentInternPathStageVo | null>(null);
const detail = ref<AssessmentInternPathVo | null>(null);
const userDetail = ref<UserVo | null>(null);
const paperRecords = ref<AssessmentPaperVo[]>([]);
const dailyCalendar = ref<AssessmentPathDailyCalendarVo | null>(null);
const finalReviewTemplate = ref<AssessmentFinalTemplateVo | null>(null);
const finalReviewTemplateLoading = ref(false);
const finalReviewItems = ref<Array<{
  dimensionId?: string;
  dimensionName?: string;
  itemId?: string;
  itemName?: string;
  itemDescription?: string;
  maxScore?: number | string;
  score: number | null;
  comment: string;
}>>([]);
const violationMap = ref<Record<string, AssessmentViolationRecordVo[]>>({});
const exitRecords = ref<AssessmentExitRecordVo[]>([]);
const expandedStageKeys = ref<string[]>([]);
const routeActionHandled = ref(false);
const activeTab = ref<'overview' | 'history' | 'daily'>('overview');
const showDailyDetailDialog = ref(false);
const activeDailyCell = ref<AssessmentPathDailyCalendarDayVo | null>(null);

const stageEndForm = reactive({
  rating: 'B',
  autoStartNext: false
});

const finalReviewForm = reactive({
  rating: 'B',
  passFlag: true,
  finalComment: ''
});

const finalReviewTotalScore = computed(() =>
  finalReviewItems.value.reduce((total, item) => total + Number(item.score || 0), 0)
);

const finalReviewMaxScore = computed(() =>
  finalReviewItems.value.reduce((total, item) => total + Number(item.maxScore || 0), 0)
);

const finalReviewGroupedItems = computed(() => {
  const groups = new Map<string, {
    key: string;
    name: string;
    maxScore: number;
    score: number;
    items: typeof finalReviewItems.value;
  }>();
  finalReviewItems.value.forEach(item => {
    const key = item.dimensionId || item.dimensionName || 'default';
    const group = groups.get(key) || {
      key,
      name: item.dimensionName || '未分组',
      maxScore: 0,
      score: 0,
      items: []
    };
    group.maxScore += Number(item.maxScore || 0);
    group.score += Number(item.score || 0);
    group.items.push(item);
    groups.set(key, group);
  });
  return Array.from(groups.values());
});

const violationForm = reactive({
  violationType: 'discipline',
  violationAt: null as number | null,
  description: ''
});

const exitForm = reactive({
  reason: ''
});

const retainForm = reactive({
  reason: ''
});

const pathId = computed(() => String(route.params.id || ''));
const dailyCalendarWeekLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] as const;
type DailyStageColor = {
  background: string;
  border: string;
  text: string;
  subText: string;
};
const dailyStagePalette: DailyStageColor[] = [
  {
    background: 'rgb(var(--em-primary-color-rgb) / 0.14)',
    border: 'rgb(var(--em-primary-color-rgb) / 0.28)',
    text: 'var(--em-primary-color)',
    subText: 'rgb(var(--em-primary-color-rgb) / 0.78)'
  },
  {
    background: 'rgb(var(--em-primary-color-rgb) / 0.11)',
    border: 'rgb(var(--em-primary-color-rgb) / 0.22)',
    text: 'rgb(var(--em-primary-color-rgb) / 0.92)',
    subText: 'rgb(var(--em-primary-color-rgb) / 0.74)'
  },
  {
    background: 'rgb(var(--em-primary-color-rgb) / 0.08)',
    border: 'rgb(var(--em-primary-color-rgb) / 0.18)',
    text: 'rgb(var(--em-primary-color-rgb) / 0.88)',
    subText: 'rgb(var(--em-primary-color-rgb) / 0.7)'
  },
  {
    background: 'rgb(var(--em-primary-color-rgb) / 0.06)',
    border: 'rgb(var(--em-primary-color-rgb) / 0.16)',
    text: 'rgb(var(--em-primary-color-rgb) / 0.82)',
    subText: 'rgb(var(--em-primary-color-rgb) / 0.68)'
  },
  {
    background: 'rgb(var(--em-primary-color-rgb) / 0.04)',
    border: 'rgb(var(--em-primary-color-rgb) / 0.14)',
    text: 'rgb(var(--em-primary-color-rgb) / 0.78)',
    subText: 'rgb(var(--em-primary-color-rgb) / 0.64)'
  },
  {
    background: 'rgb(var(--em-primary-color-rgb) / 0.09)',
    border: 'rgb(var(--em-primary-color-rgb) / 0.2)',
    text: 'rgb(var(--em-primary-color-rgb) / 0.9)',
    subText: 'rgb(var(--em-primary-color-rgb) / 0.72)'
  }
];

const currentUserOptions = computed<UserOptionVo[]>(() =>
  [
    {
      id: detail.value?.userId || userDetail.value?.id,
      employeeNo: detail.value?.employeeNo || userDetail.value?.employeeNo,
      name: detail.value?.userName || userDetail.value?.name || userDetail.value?.username
    }
  ].filter(item => Boolean(item.id))
);

function getDailyStageKey(day?: Pick<AssessmentPathDailyCalendarDayVo, 'pathStageId' | 'stageId'> | null) {
  return day?.pathStageId || day?.stageId || '';
}

function createDateByText(value?: string | null) {
  if (!value || value === '-') return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateToText(date?: Date | null) {
  if (!date) return '';
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseColor(color?: string | null) {
  if (!color) return null;
  const value = color.trim();
  if (!value) return null;

  const shortHex = /^#([0-9a-f]{3})$/i.exec(value);
  if (shortHex) {
    const [red, green, blue] = shortHex[1].split('');
    return {
      red: parseInt(`${red}${red}`, 16),
      green: parseInt(`${green}${green}`, 16),
      blue: parseInt(`${blue}${blue}`, 16)
    };
  }

  const fullHex = /^#([0-9a-f]{6})$/i.exec(value);
  if (fullHex) {
    return {
      red: parseInt(fullHex[1].slice(0, 2), 16),
      green: parseInt(fullHex[1].slice(2, 4), 16),
      blue: parseInt(fullHex[1].slice(4, 6), 16)
    };
  }

  const rgb = /^rgba?\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})/i.exec(value);
  if (rgb) {
    return {
      red: Math.min(255, Number(rgb[1])),
      green: Math.min(255, Number(rgb[2])),
      blue: Math.min(255, Number(rgb[3]))
    };
  }

  return null;
}

function toRgba(color: NonNullable<ReturnType<typeof parseColor>>, alpha: number) {
  return `rgba(${color.red}, ${color.green}, ${color.blue}, ${alpha})`;
}

function darkenChannel(channel: number, factor: number) {
  return Math.max(0, Math.min(255, Math.round(channel * factor)));
}

function getColorText(color: NonNullable<ReturnType<typeof parseColor>>) {
  const luminance = (color.red * 299 + color.green * 587 + color.blue * 114) / 1000;
  const factor = luminance >= 190 ? 0.34 : luminance >= 160 ? 0.42 : luminance >= 130 ? 0.54 : luminance >= 100 ? 0.7 : 0.88;
  return `rgb(${darkenChannel(color.red, factor)}, ${darkenChannel(color.green, factor)}, ${darkenChannel(color.blue, factor)})`;
}

function getSubColorText(color: NonNullable<ReturnType<typeof parseColor>>) {
  const luminance = (color.red * 299 + color.green * 587 + color.blue * 114) / 1000;
  const factor = luminance >= 190 ? 0.42 : luminance >= 160 ? 0.5 : luminance >= 130 ? 0.62 : luminance >= 100 ? 0.78 : 0.92;
  return `rgb(${darkenChannel(color.red, factor)}, ${darkenChannel(color.green, factor)}, ${darkenChannel(color.blue, factor)})`;
}

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
    )
  }));
});

const dailyStageColorMap = computed(() => {
  const map = new Map<string, (typeof dailyStagePalette)[number]>();
  Array.from(
    (dailyCalendar.value?.days || []).reduce((result, item) => {
      const key = getDailyStageKey(item);
      if (!key || result.has(key)) return result;
      result.set(key, item.stageColor || '');
      return result;
    }, new Map<string, string>())
  ).forEach(([stageKey, stageColor], index) => {
    const parsed = parseColor(stageColor);
    if (parsed) {
      map.set(stageKey, {
        background: toRgba(parsed, 0.14),
        border: toRgba(parsed, 0.28),
        text: getColorText(parsed),
        subText: getSubColorText(parsed)
      });
      return;
    }
    map.set(stageKey, dailyStagePalette[index % dailyStagePalette.length]);
  });
  return map;
});

const dailyStageLegend = computed(() =>
  Array.from(
    (dailyCalendar.value?.days || []).reduce(
      (map, item) => {
        const key = getDailyStageKey(item);
        if (!key || map.has(key)) return map;
        map.set(key, {
          key,
          name: item.stageName || '-',
          color: dailyStageColorMap.value.get(key)
        });
        return map;
      },
      new Map<string, { key: string; name: string; color?: (typeof dailyStagePalette)[number] }>()
    ).values()
  )
);

const dailyCalendarRows = computed(() => {
  const dayList = dailyCalendar.value?.days || [];
  if (!dayList.length) return [] as Array<{
    key: string;
    cells: Array<
      | {
          key: string;
          isToday: boolean;
          dateText: string;
          monthText: string;
          dayText: string;
          raw: AssessmentPathDailyCalendarDayVo | null;
          color?: (typeof dailyStagePalette)[number];
          muted: boolean;
          clickable: boolean;
        }
      | null
    >;
  }>;
  const dayMap = new Map(dayList.map(item => [formatDateDay(item.date), item] as const));
  const startDate = createDateByText(formatDateDay(dailyCalendar.value?.startDate));
  const endDate = createDateByText(formatDateDay(dailyCalendar.value?.endDate));
  if (!startDate || !endDate) return [];

  const calendarStart = new Date(startDate);
  calendarStart.setDate(calendarStart.getDate() - ((calendarStart.getDay() + 6) % 7));

  const calendarEnd = new Date(endDate);
  calendarEnd.setDate(calendarEnd.getDate() + ((7 - ((calendarEnd.getDay() + 6) % 7) - 1 + 7) % 7));

  const cells: Array<{
    key: string;
    isToday: boolean;
    dateText: string;
    monthText: string;
    dayText: string;
    raw: AssessmentPathDailyCalendarDayVo | null;
    color?: (typeof dailyStagePalette)[number];
    muted: boolean;
    clickable: boolean;
  }> = [];

  const cursor = new Date(calendarStart);
  const startText = formatDateToText(startDate);
  const endText = formatDateToText(endDate);
  while (cursor.getTime() <= calendarEnd.getTime()) {
    const dateText = formatDateToText(cursor);
    const raw = dayMap.get(dateText) || null;
    const inTraining = dateText >= startText && dateText <= endText;
    const hasStageSchedule = Boolean(raw?.pathStageId || raw?.stageId || raw?.stageName);
    const muted = !inTraining || Boolean(raw?.holidayFlag) || !hasStageSchedule;
    const clickable = Boolean(raw && (raw.reports?.length || raw.pathStageId || raw.stageId || raw.holidayFlag));
    cells.push({
      key: dateText,
      isToday: dateText === formatDateDay(new Date().toISOString()),
      dateText,
      monthText: `${Number(dateText.slice(5, 7))}月`,
      dayText: `${Number(dateText.slice(8, 10))}日`,
      raw,
      color: raw ? dailyStageColorMap.value.get(getDailyStageKey(raw)) : undefined,
      muted,
      clickable
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  const rows: Array<{
    key: string;
    cells: Array<(typeof cells)[number]>;
  }> = [];

  for (let index = 0; index < cells.length; index += 7) {
    const rowCells = cells.slice(index, index + 7);
    rows.push({
      key: rowCells[0]?.dateText || `row-${index}`,
      cells: rowCells
    });
  }

  return rows;
});

const dailyCalendarSummary = computed(() => {
  const days = dailyCalendar.value?.days || [];
  const submittedCount = days.filter(item => item.reportStatus === 'submitted').length;
  const pendingCount = days.filter(item => item.reportStatus === 'pending').length;
  const overtimeCount = days.filter(item => item.overtimeStageFlag).length;
  return {
    startDate: formatDateDay(dailyCalendar.value?.startDate),
    endDate: formatDateDay(dailyCalendar.value?.endDate),
    submittedCount,
    pendingCount,
    overtimeCount
  };
});

const dailyCalendarStageCount = computed(() => dailyStageLegend.value.length);

const dailyCalendarHeaderTags = computed(() => [
  { label: '培训区间', value: `${dailyCalendarSummary.value.startDate} ~ ${dailyCalendarSummary.value.endDate}` },
  { label: '阶段数', value: `${dailyCalendarStageCount.value}` },
  { label: '已提交', value: `${dailyCalendarSummary.value.submittedCount}` },
  { label: '未提交', value: `${dailyCalendarSummary.value.pendingCount}` },
  { label: '超时天数', value: `${dailyCalendarSummary.value.overtimeCount}` }
]);

function resolveFocusStage(stages: AssessmentInternPathStageVo[], currentStageId?: string | null) {
  const stageList = stages || [];
  if (!stageList.length) return null;

  return (
    stageList.find(item => item.status === 'pending_review')
    || stageList.find(item => (item.stageId === currentStageId || item.id === currentStageId) && item.status !== 'pending')
    || stageList.find(item => item.status === 'in_progress')
    || stageList.find(item => item.status === 'failed')
    || stageList.find(item => item.stageId === currentStageId || item.id === currentStageId)
    || stageList.find(item => item.status === 'pending')
    || stageList[0]
  );
}

const currentStage = computed(() => {
  const stages = stageRecords.value;
  if (!stages.length) return null;

  return resolveFocusStage(stages, detail.value?.currentStageId);
});

const currentStageLatestRecord = computed(() => getStageLatestRecord(currentStage.value));
const isPathTerminated = computed(() => ['dismissed', 'voluntary_resigned'].includes(detail.value?.status || ''));
const isPathCompleted = computed(() => detail.value?.status === 'completed');
const isPathPendingFinalReview = computed(() => ['pending_final_review', 'final_failed'].includes(detail.value?.status || ''));
const totalViolationCount = computed(() =>
  Object.values(violationMap.value).reduce((total, records) => total + records.length, 0)
);
const allViolationRecords = computed(() =>
  Object.values(violationMap.value)
    .flat()
    .sort((left, right) => new Date(right.violationAt || right.createdAt || 0).getTime() - new Date(left.violationAt || left.createdAt || 0).getTime())
);
const currentStageViolations = computed(() => {
  const key = currentStage.value?.id || '';
  return key ? violationMap.value[key] || [] : [];
});
const latestViolationRecord = computed(() => allViolationRecords.value[0] || null);
const latestExitRecord = computed(() => exitRecords.value[0] || null);
const latestDismissPendingRecord = computed(() => latestExitRecord.value?.exitType === 'dismiss_pending' ? latestExitRecord.value : null);
const isDismissPending = computed(() => detail.value?.status === 'dismiss_pending' || latestExitRecord.value?.exitType === 'dismiss_pending');
const canFinalReview = computed(() => !isPathCompleted.value && !isPathTerminated.value && !isDismissPending.value && isPathPendingFinalReview.value);
const canCreateFinalReviewLink = computed(() => !isPathCompleted.value && !isPathTerminated.value && !isDismissPending.value);
const canManageTraining = computed(() => !isPathCompleted.value && !isPathTerminated.value && !isDismissPending.value && !isPathPendingFinalReview.value);
const canConfirmDismissed = computed(() => isDismissPending.value && !isPathTerminated.value);
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

const basicInfoItems = computed(() => [
  { label: '实习生', text: detail.value?.userName || userDetail.value?.name || userDetail.value?.username || '-' },
  { label: '工号', text: detail.value?.employeeNo || userDetail.value?.employeeNo || '-' },
  { label: '账号', text: userDetail.value?.account || '-' },
  { label: '性别', dictCode: 'employee_gender', dictValue: userDetail.value?.gender },
  { label: '手机号', text: userDetail.value?.phone || '-' },
  { label: '邮箱', text: userDetail.value?.email || '-' },
  { label: '所属部门', text: userDetail.value?.departmentName || '-' },
  {
    label: '岗位',
    dictCode: 'employee_position',
    dictValue: userDetail.value?.positionName,
    fallbackLabel: userDetail.value?.positionNameLabel || '-'
  },
  {
    label: '用户类型',
    dictCode: 'user_type',
    dictValue: userDetail.value?.userType,
    fallbackLabel: userDetail.value?.userTypeLabel || '-'
  },
  { label: '是否负责人', text: userDetail.value?.leaderFlag ? '是' : '否' },
  { label: '入职状态', dictCode: 'employee_job_status', dictValue: userDetail.value?.jobStatus, fallbackLabel: userDetail.value?.jobStatusLabel || '' },
  { label: '工作状态', dictCode: 'employee_work_status', dictValue: userDetail.value?.workStatus, fallbackLabel: userDetail.value?.workStatusLabel || '' },
  { label: '账号状态', dictCode: 'employee_account_status', dictValue: userDetail.value?.accountStatus, fallbackLabel: userDetail.value?.accountStatusLabel || '' },
  { label: '更新时间', text: userDetail.value?.updatedAt || detail.value?.updatedAt || '-' }
]);

const trainingOverviewItems = computed(() => [
  { label: '培训模板', text: detail.value?.templateName || '-' },
  { label: '总体考评模板', text: detail.value?.finalTemplateName || '-' },
  { label: '培训开始时间', text: detail.value?.trainingStartDate || '-' },
  { label: '培训结束时间', text: detail.value?.trainingEndDate || '-' },
  { label: '当前培训阶段', text: detail.value?.currentStageName || '-' },
  { label: '培训状态', dictCode: 'assessment_path_status', dictValue: detail.value?.status, fallbackLabel: detail.value?.statusLabel || '' },
  { label: '总体评级', dictCode: 'assessment_stage_rating', dictValue: detail.value?.finalRating, fallbackLabel: detail.value?.finalRatingLabel || '-' },
  { label: '总体得分', text: detail.value?.finalScore == null ? '-' : `${detail.value.finalScore}` },
  {
    label: '总体结果',
    dictCode: 'assessment_pass_result',
    dictValue: detail.value?.finalPassFlag == null ? 'pending' : detail.value.finalPassFlag ? 'passed' : 'failed',
    fallbackLabel: detail.value?.finalPassFlag == null ? '-' : detail.value.finalPassFlag ? '通过' : '未通过'
  },
  { label: '总体考评时间', text: detail.value?.finalReviewedAt || '-' },
  { label: '总体考评说明', text: detail.value?.finalComment || '-' },
  { label: '累计违规次数', text: String(totalViolationCount.value) },
  { label: '阶段数量', text: String(detail.value?.stages?.length || 0) },
  { label: '当前学习时间', text: resolveStudyDaysText(currentStage.value) },
  { label: '当前阶段时间状态', dictCode: 'assessment_stage_timing_status', dictValue: currentStage.value?.timingStatus, fallbackLabel: currentStage.value?.timingStatusLabel || '' },
  { label: '培训开始时间', text: currentStage.value?.startedAt || '-' },
  { label: '培训结束时间', text: currentStage.value?.endedAt || '-' },
  { label: '实际学习天数', text: resolveActualStudyDaysText(currentStage.value) },
  { label: '考核时间', text: currentStage.value?.assessAt || '-' },
  { label: '培训是否超时', text: resolveFlagText(currentStage.value?.overtimeFlag) },
  { label: '考核是否延迟', text: resolveFlagText(currentStage.value?.delayedAssessFlag) },
  { label: '最早考核时间', text: currentStage.value?.earliestAssessAt || '-' },
  { label: '最晚考核时间', text: currentStage.value?.latestAssessAt || '-' },
  { label: '时间说明', text: currentStage.value?.timingDescription || '-' }
]);

watch(pathId, () => {
  routeActionHandled.value = false;
  loadDetail();
});

watch(
  () => route.query.action,
  () => {
    routeActionHandled.value = false;
    if (detail.value) {
      handleRouteAutoAction();
    }
  }
);

onMounted(() => {
  loadDetail();
});

async function loadDetail() {
  if (!pathId.value) {
    detail.value = null;
    userDetail.value = null;
    paperRecords.value = [];
    dailyCalendar.value = null;
    violationMap.value = {};
    exitRecords.value = [];
    return;
  }

  loading.value = true;
  try {
    const { data, error } = await fetchAssessmentPathById(pathId.value);
    if (error || !data) {
      detail.value = null;
      userDetail.value = null;
      paperRecords.value = [];
      dailyCalendar.value = null;
      violationMap.value = {};
      exitRecords.value = [];
      return;
    }

    detail.value = data;

    const tasks: Promise<unknown>[] = [
      loadPaperRecords(data.id || ''),
      loadDailyCalendar(data.id || ''),
      loadViolationRecords(data.id || ''),
      loadExitRecords(data.id || '', data.userId || '')
    ];
    if (data.userId) {
      tasks.push(loadUserDetail(data.userId));
    } else {
      userDetail.value = null;
    }

    await Promise.all(tasks);
    syncExpandedStageKeys(data.stages || [], data.currentStageId || '');
    handleRouteAutoAction();
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

async function loadDailyCalendar(currentPathId: string) {
  if (!currentPathId) {
    dailyCalendar.value = null;
    return;
  }
  const { data, error } = await fetchAssessmentPathDailyCalendar(currentPathId);
  dailyCalendar.value = error ? null : data || null;
}

async function loadViolationRecords(currentPathId: string) {
  if (!currentPathId) {
    violationMap.value = {};
    return;
  }
  const { data, error } = await fetchAssessmentPathViolationList({ pathId: currentPathId });
  if (error) {
    violationMap.value = {};
    return;
  }
  const grouped = (data || []).reduce<Record<string, AssessmentViolationRecordVo[]>>((result, item) => {
    const key = item.pathStageId || '';
    if (!key) return result;
    if (!result[key]) result[key] = [];
    result[key].push(item);
    return result;
  }, {});
  violationMap.value = grouped;
}

async function loadExitRecords(currentPathId: string, userId: string) {
  if (!currentPathId && !userId) {
    exitRecords.value = [];
    return;
  }
  const { data, error } = await fetchAssessmentPathExitList({ pathId: currentPathId || undefined, userId: userId || undefined });
  exitRecords.value = error ? [] : data || [];
}

function getPaperPassType(record?: AssessmentPaperVo): 'default' | 'success' | 'error' | 'warning' {
  if (record?.status === 'pending_review') return 'warning';
  if (record?.passFlag === true) return 'success';
  if (record?.passFlag === false) return 'error';
  return 'warning';
}

function getStageViolations(stage?: AssessmentInternPathStageVo | null) {
  const key = stage?.id || '';
  return key ? violationMap.value[key] || [] : [];
}

function resolveExitStageName(record?: AssessmentExitRecordVo | null) {
  if (!record?.pathStageId) return detail.value?.currentStageName || '-';
  const matchedStage = (detail.value?.stages || []).find(item => item.id === record.pathStageId);
  return matchedStage?.stageName || detail.value?.currentStageName || '-';
}

function getExitRecordTagType(exitType?: string): 'error' | 'warning' | 'default' {
  if (exitType === 'dismissed') return 'error';
  if (exitType === 'dismiss_pending' || exitType === 'dismiss_retain') return 'warning';
  return 'default';
}

function getExitBannerClass(exitType?: string) {
  if (exitType === 'dismissed') return 'detail-banner--error';
  if (exitType === 'dismiss_pending' || exitType === 'dismiss_retain') return 'detail-banner--warning';
  return 'detail-banner--default';
}

function getExitBannerText(exitType?: string) {
  if (exitType === 'dismissed') return '该实习生已确认劝退离场';
  if (exitType === 'dismiss_pending') return '该实习生已标记劝退，待确认离场';
  if (exitType === 'dismiss_cancel') return '该实习生已取消本次劝退处理';
  if (exitType === 'dismiss_retain') return '该实习生已暂时保留，可继续观察';
  return '该实习生已登记主动离职';
}

function getViolationBannerClass() {
  if (totalViolationCount.value > 2) return 'detail-banner--error';
  if (totalViolationCount.value > 0) return 'detail-banner--warning';
  return 'detail-banner--default';
}

function getViolationBannerText() {
  if (totalViolationCount.value > 2) return '累计违规已超过 2 次，建议立即进行劝退处理';
  if (totalViolationCount.value > 0) return '该实习生存在违规记录，请持续关注';
  return '暂无违规记录，当前培训情况正常';
}

function resolveViolationStageName(record?: AssessmentViolationRecordVo | null) {
  if (!record) return currentStage.value?.stageName || detail.value?.currentStageName || '-';
  if (record.stageName) return record.stageName;
  const matchedStage = (detail.value?.stages || []).find(item => item.id === record.pathStageId || item.stageId === record.stageId);
  return matchedStage?.stageName || currentStage.value?.stageName || detail.value?.currentStageName || '-';
}

function isDismissedCurrentStage(stage: AssessmentInternPathStageVo) {
  if (latestExitRecord.value?.exitType !== 'dismissed') return false;
  const dismissedStageId = latestExitRecord.value?.pathStageId || detail.value?.currentStageId || '';
  if (!dismissedStageId) return false;
  return stage.id === dismissedStageId || stage.stageId === dismissedStageId;
}

function hasStageViolation(stage: AssessmentInternPathStageVo) {
  if (stage.violationFlag) return true;
  return getStageViolations(stage).length > 0;
}

function getStageDotClass(stage: AssessmentInternPathStageVo) {
  if (isDismissedCurrentStage(stage)) return 'is-error';
  if (stage.timingStatus === 'overdue' || stage.timingStatus === 'assessed_overdue') return 'is-error';
  if (stage.status === 'passed') return 'is-success';
  if (stage.status === 'in_progress' || stage.status === 'pending_review') {
    return hasStageViolation(stage) ? 'is-warning' : 'is-info';
  }
  if (stage.status === 'failed') return 'is-error';
  if (stage.status === 'skipped') return 'is-info';
  if (stage.status === 'ended') return 'is-default';
  return 'is-default';
}

function getStageResultText(stage: AssessmentInternPathStageVo) {
  if (stage.latestPaperStatus === 'pending_review') return '待批阅';
  if (stage.latestPaperPassFlag === true) return '通过';
  if (stage.latestPaperPassFlag === false) return '未通过';
  if (stage.status === 'in_progress') return '培训中';
  if (stage.status === 'skipped') return '已跳过';
  if (stage.status === 'ended') return '已结束';
  return '未开始培训';
}

function getStageResultTagType(stage: AssessmentInternPathStageVo): 'default' | 'success' | 'warning' | 'error' | 'info' {
  if (stage.latestPaperStatus === 'pending_review') return 'warning';
  if (stage.latestPaperPassFlag === true) return 'success';
  if (stage.latestPaperPassFlag === false) return 'error';
  if (stage.status === 'in_progress') return hasStageViolation(stage) ? 'warning' : 'info';
  if (stage.status === 'skipped') return 'info';
  if (stage.status === 'ended') return 'default';
  return 'default';
}

function getRecordResultText(record: AssessmentPaperVo) {
  return getAssessmentPassResultLabel(record.status, record.passFlag);
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
    const focusStage = resolveFocusStage(stages || [], currentStageId);
    const fallbackKey = getStageKey(focusStage) || getStageKey(stages?.[0]);
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

function getDailyStatusTagType(status?: AssessmentPathDailyCalendarDayVo['reportStatus']): 'default' | 'success' | 'warning' | 'error' | 'info' {
  if (status === 'submitted') return 'success';
  if (status === 'pending') return 'error';
  if (status === 'holiday') return 'info';
  if (status === 'upcoming') return 'warning';
  return 'default';
}

function getDailyStatusText(day?: AssessmentPathDailyCalendarDayVo | null) {
  if (!day) return '-';
  if (day.stageStartedFlag === false) return '未开始';
  const statusLabel = getAssessmentDailyReportStatusLabel(day.reportStatus, day.holidayFlag);
  if (statusLabel !== '空白') return statusLabel;
  return day.expectedReportFlag ? '待提交' : '无需提交';
}

function getDailyCellSummary(day?: AssessmentPathDailyCalendarDayVo | null) {
  if (!day) return '-';
  if (day.assessDate) {
    return `考核日期 ${formatDateDay(day.assessDate)}`;
  }
  if (day.stageStartedFlag === false) return '阶段未开始';
  if (day.submittedFlag) {
    return `日报 ${day.reports?.length || 0} 条`;
  }
  if (day.holidayFlag) return '休息日';
  if (day.expectedReportFlag) return day.reportStatus === 'upcoming' ? '后续需提交' : '应提交未提交';
  return '无需提交';
}

function openDailyDetail(day?: AssessmentPathDailyCalendarDayVo | null) {
  if (!day) return;
  activeDailyCell.value = day;
  showDailyDetailDialog.value = true;
}

function handleCloseDailyDetail() {
  showDailyDetailDialog.value = false;
  activeDailyCell.value = null;
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
  if (stage.status === 'in_progress') return hasStageViolation(stage) ? 'warning' : 'info';
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
    canManageTraining.value
    && stage.id
    && ((stage.id && stage.id === currentStage.value?.id) || (stage.stageId && stage.stageId === detail.value?.currentStageId))
    && ['pending', 'failed'].includes(stage.status || '')
  );
}

function canEndStage(stage: AssessmentInternPathStageVo) {
  return Boolean(
    canManageTraining.value
    && stage.id
    && ['in_progress', 'pending_review', 'failed', 'passed'].includes(stage.status || '')
  );
}

function getEndStageButtonText(stage: AssessmentInternPathStageVo) {
  if (stage.status === 'passed' || stage.status === 'failed') {
    return stage.rating ? '调整评级' : '阶段评级';
  }
  if (stage.status === 'pending_review') {
    return '结束阶段';
  }
  return '结束阶段';
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

function handleViewPaper(record: AssessmentPaperVo) {
  if (!record.id) return;
  activePaperId.value = record.id;
  activePaperReadonly.value = record.status !== 'pending_review';
  showPaperDialog.value = true;
}

function getStageLatestRecord(stage: (AssessmentInternPathStageVo & { records?: AssessmentPaperVo[] }) | null | undefined) {
  return stage?.records?.[0] || null;
}

function resolveStageActionMode(
  stage: (AssessmentInternPathStageVo & { records?: AssessmentPaperVo[] }) | null | undefined,
  latestRecord: AssessmentPaperVo | null
): StageActionMode {
  if (!detail.value?.id || !detail.value?.userId || !stage || !canManageTraining.value) return 'none';
  if (latestRecord?.id && latestRecord.status === 'pending_review') return 'review';
  if (['pending', 'failed'].includes(stage.status || '')) return stage.id ? 'start' : 'none';
  if (stage.status === 'pending_review') return latestRecord?.id ? 'review' : 'none';
  if (stage.status === 'in_progress') return 'create';
  if (latestRecord?.id) return 'view';
  return 'none';
}

function canGenerateStage(stage: AssessmentInternPathStageVo) {
  if (!detail.value?.id || !detail.value?.userId || !canManageTraining.value) return false;
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

function handleEndTraining() {
  if (!detail.value?.id) return;
  window.$dialog?.warning({
    title: '结束阶段培训',
    content: '确认结束当前阶段培训吗？结束后，当前未完成阶段及后续阶段都将标记为“已结束”，培训会进入“待总体考评”，总体考评通过后才会正式结训。',
    positiveText: '确认结束阶段',
    negativeText: '取消',
    onPositiveClick: async () => {
      actionLoadingStageId.value = detail.value?.id || 'path-end';
      try {
        const { error } = await fetchAssessmentPathEnd({ pathId: detail.value?.id });
        if (error) return;
        window.$message?.success('阶段培训已结束，请进行总体考评');
        await loadDetail();
      } finally {
        actionLoadingStageId.value = '';
      }
    }
  });
}

function buildFinalReviewItemsFromSaved() {
  const savedDimensions = detail.value?.finalReviewDimensions || [];
  return savedDimensions.flatMap(dimension =>
    (dimension.items || []).map(item => ({
      dimensionId: dimension.dimensionId || item.dimensionId,
      dimensionName: dimension.dimensionName || item.dimensionName,
      itemId: item.itemId,
      itemName: item.itemName,
      itemDescription: item.itemDescription,
      maxScore: item.maxScore,
      score: item.score == null ? null : Number(item.score),
      comment: item.comment || ''
    }))
  );
}

function buildFinalReviewItemsFromTemplate(template: AssessmentFinalTemplateVo | null) {
  return (template?.dimensions || []).flatMap(dimension =>
    (dimension.items || []).map(item => ({
      dimensionId: dimension.id,
      dimensionName: dimension.name,
      itemId: item.id,
      itemName: item.name,
      itemDescription: item.description,
      maxScore: item.score,
      score: null,
      comment: ''
    }))
  );
}

async function openFinalReviewDialog() {
  if (!detail.value?.finalTemplateId) {
    window.$message?.warning('当前培训模板未配置总体考评模板，请先在培训模板中选择最终考核模板');
    return;
  }
  finalReviewForm.rating = detail.value?.finalRating || 'B';
  finalReviewForm.passFlag = detail.value?.finalPassFlag ?? true;
  finalReviewForm.finalComment = detail.value?.finalComment || '';
  finalReviewTemplate.value = null;
  finalReviewItems.value = buildFinalReviewItemsFromSaved();
  showFinalReviewDialog.value = true;

  finalReviewTemplateLoading.value = true;
  try {
    const { data, error } = await fetchAssessmentFinalTemplateById(detail.value.finalTemplateId);
    if (error) return;
    finalReviewTemplate.value = data || null;
    if (!finalReviewItems.value.length) {
      finalReviewItems.value = buildFinalReviewItemsFromTemplate(data || null);
    }
  } finally {
    finalReviewTemplateLoading.value = false;
  }
}

async function handleFinalReviewSubmit() {
  if (!detail.value?.id) return;
  if (!finalReviewForm.rating) {
    window.$message?.warning('请选择总体评级');
    return;
  }
  if (!finalReviewItems.value.length) {
    window.$message?.warning('当前总体考评模板未配置评分项');
    return;
  }
  const unfinishedItem = finalReviewItems.value.find(item => item.score === null || item.score === undefined);
  if (unfinishedItem) {
    window.$message?.warning(`请填写「${unfinishedItem.itemName || '评分项'}」得分`);
    return;
  }
  const invalidItem = finalReviewItems.value.find(item => Number(item.score) < 0 || Number(item.score) > Number(item.maxScore || 0));
  if (invalidItem) {
    window.$message?.warning(`「${invalidItem.itemName || '评分项'}」得分需在 0 到 ${invalidItem.maxScore || 0} 之间`);
    return;
  }
  actionLoadingStageId.value = 'final-review';
  try {
    const { error, msg } = await fetchAssessmentPathFinalReview({
      pathId: detail.value.id,
      rating: finalReviewForm.rating,
      passFlag: finalReviewForm.passFlag,
      finalComment: finalReviewForm.finalComment.trim() || undefined,
      finalItems: finalReviewItems.value.map(item => ({
        dimensionId: item.dimensionId,
        itemId: item.itemId,
        score: item.score,
        comment: item.comment.trim() || undefined
      }))
    });
    if (error) return;
    window.$message?.success(msg || '总体考评已提交');
    showFinalReviewDialog.value = false;
    await loadDetail();
  } finally {
    actionLoadingStageId.value = '';
  }
}

async function handleCreateFinalReviewLink() {
  if (!detail.value?.id) return;
  actionLoadingStageId.value = 'final-review-link';
  try {
    const { data, error } = await fetchAssessmentFinalReviewLinkCreate({ pathId: detail.value.id });
    if (error || !data?.linkPath) return;
    const url = `${window.location.origin}${data.linkPath}`;
    await navigator.clipboard?.writeText(url);
    window.$message?.success('总体考评链接已生成并复制');
  } finally {
    actionLoadingStageId.value = '';
  }
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
  activePaperReadonly.value = true;
}

async function handlePaperDialogRefresh() {
  await loadDetail();
}

function handleRouteAutoAction() {
  if (routeActionHandled.value) return;
  if (route.query.action !== 'violation') return;
  if (!currentStage.value?.id || !canManageTraining.value) return;
  routeActionHandled.value = true;
  openViolationDialog(currentStage.value);
  const nextQuery = { ...route.query };
  delete nextQuery.action;
  navigateTo(
    {
      path: route.path,
      query: nextQuery
    },
    { replace: true }
  );
}

function openViolationDialog(stage?: AssessmentInternPathStageVo | null) {
  const targetStage = stage || currentStage.value;
  if (!targetStage?.id) {
    window.$message?.warning('当前没有可登记违规的培训阶段');
    return;
  }
  editingViolationStage.value = targetStage;
  violationForm.violationType = 'discipline';
  violationForm.violationAt = Date.now();
  violationForm.description = '';
  showViolationDialog.value = true;
}

function formatDateTimeValue(value?: number | null) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

async function handleSaveViolation() {
  if (!editingViolationStage.value?.id) return;
  if (!violationForm.description.trim()) {
    window.$message?.warning('请输入违规原因');
    return;
  }
  actionLoadingStageId.value = editingViolationStage.value.id;
  try {
    const { error, msg } = await fetchAssessmentPathViolationSave({
      pathId: editingViolationStage.value.pathId,
      pathStageId: editingViolationStage.value.id,
      userId: editingViolationStage.value.userId,
      violationType: violationForm.violationType,
      violationAt: formatDateTimeValue(violationForm.violationAt) || undefined,
      description: violationForm.description.trim()
    });
    if (error) return;
    window.$message?.success(msg || '违规记录已保存');
    showViolationDialog.value = false;
    await loadDetail();
  } finally {
    actionLoadingStageId.value = '';
  }
}

function openExitDialog() {
  if (!detail.value?.userId) {
    window.$message?.warning('当前实习生信息不完整');
    return;
  }
  exitForm.reason = '';
  showExitDialog.value = true;
}

async function handleSaveExit() {
  await submitExit('dismiss_pending');
}

async function submitExit(exitType: 'dismiss_pending' | 'dismissed' | 'dismiss_cancel' | 'dismiss_retain') {
  if (!detail.value?.userId) return;
  const reason = exitType === 'dismiss_retain'
    ? retainForm.reason.trim()
    : exitForm.reason.trim() || latestDismissPendingRecord.value?.reason || '';
  if (exitType === 'dismiss_pending' && !reason) {
    window.$message?.warning('请输入劝退理由');
    return;
  }
  if (exitType === 'dismiss_retain' && !reason) {
    window.$message?.warning('请输入暂时保留原因');
    return;
  }
  actionLoadingStageId.value = exitType === 'dismissed'
    ? 'confirm-exit'
    : exitType === 'dismiss_cancel'
      ? 'cancel-exit'
      : exitType === 'dismiss_retain'
        ? 'retain-exit'
        : currentStage.value?.id || detail.value.id || 'exit';
  try {
    const { error, msg } = await fetchAssessmentPathExitSave({
      pathId: detail.value.id,
      pathStageId: currentStage.value?.id,
      userId: detail.value.userId,
      exitType,
      reason: reason || undefined
    });
    if (error) return;
    const fallbackMessageMap: Record<string, string> = {
      dismiss_pending: '已标记劝退',
      dismissed: '已确认劝退离场',
      dismiss_cancel: '已取消劝退',
      dismiss_retain: '已暂时保留'
    };
    window.$message?.success(msg || fallbackMessageMap[exitType]);
    showExitDialog.value = false;
    showRetainDialog.value = false;
    await loadDetail();
  } finally {
    actionLoadingStageId.value = '';
  }
}

function handleConfirmDismissed() {
  if (!detail.value?.userId) return;
  window.$dialog?.warning({
    title: '确认劝退离场',
    content: '确认后该实习生将记录为已离职，培训状态将变更为已劝退。是否继续？',
    positiveText: '确认离场',
    negativeText: '取消',
    onPositiveClick: () => submitExit('dismissed')
  });
}

function handleCancelDismissed() {
  if (!detail.value?.userId) return;
  window.$dialog?.warning({
    title: '取消劝退',
    content: '取消后将恢复当前培训流程状态，是否继续？',
    positiveText: '确认取消',
    negativeText: '返回',
    onPositiveClick: () => submitExit('dismiss_cancel')
  });
}

function openRetainDialog() {
  retainForm.reason = '';
  showRetainDialog.value = true;
}
</script>

<template>
  <InfoPageLayout>
    <template #title>
      <NTabs v-model:value="activeTab" type="line" animated class="detail-page-tabs">
        <NTabPane name="overview" tab="基本信息" />
        <NTabPane name="history" tab="培训履历" />
        <NTabPane name="daily" tab="日报" />
      </NTabs>
    </template>

    <template #actions>
      <NButton
        v-if="canManageTraining && canAssessAction"
        type="primary"
        :loading="Boolean(currentStage?.id && actionLoadingStageId === currentStage.id)"
        @click="handleAssessCurrentStage"
      >
        {{ currentAssessActionText }}
      </NButton>
      <NButton v-if="canManageTraining" secondary type="warning" :disabled="!currentStage?.id" @click="openViolationDialog()">
        违规登记
      </NButton>
      <NButton
        v-if="canManageTraining"
        secondary
        :loading="actionLoadingStageId === detail?.id"
        @click="handleEndTraining"
      >
        结束阶段培训
      </NButton>
      <NButton
        v-if="canCreateFinalReviewLink"
        secondary
        type="primary"
        :loading="actionLoadingStageId === 'final-review-link'"
        @click="handleCreateFinalReviewLink"
      >
        生成考评链接
      </NButton>
      <NButton
        v-if="canFinalReview"
        type="primary"
        :loading="actionLoadingStageId === 'final-review'"
        @click="openFinalReviewDialog"
      >
        总体考评
      </NButton>
      <NButton v-if="canManageTraining" secondary type="error" @click="openExitDialog()">
        标记劝退
      </NButton>
      <NButton
        v-if="canConfirmDismissed"
        secondary
        type="default"
        :loading="actionLoadingStageId === 'cancel-exit'"
        @click="handleCancelDismissed"
      >
        取消劝退
      </NButton>
      <NButton
        v-if="canConfirmDismissed"
        secondary
        type="warning"
        :loading="actionLoadingStageId === 'retain-exit'"
        @click="openRetainDialog"
      >
        暂时保留
      </NButton>
      <NButton
        v-if="canConfirmDismissed"
        secondary
        type="error"
        :loading="actionLoadingStageId === 'confirm-exit'"
        @click="handleConfirmDismissed"
      >
        确认劝退离场
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
            <div v-if="latestExitRecord" class="detail-banner" :class="getExitBannerClass(latestExitRecord.exitType)">
              <div class="detail-banner__title">
                <DictTag dict-code="assessment_exit_type" :value="latestExitRecord.exitType" />
                <span>{{ getExitBannerText(latestExitRecord.exitType) }}</span>
              </div>
              <div class="detail-banner__meta">
                <span>处理时间：{{ latestExitRecord.exitAt || '-' }}</span>
                <span>所属阶段：{{ resolveExitStageName(latestExitRecord) }}</span>
                <span>累计违规：{{ latestExitRecord.violationCount ?? 0 }} 次</span>
              </div>
              <div v-if="latestExitRecord.reason" class="detail-banner__desc">处理说明：{{ latestExitRecord.reason }}</div>
            </div>

            <div v-else-if="totalViolationCount > 2" class="detail-banner detail-banner--warning">
              <div class="detail-banner__title">
                <span>累计违规已超过 2 次，建议立即进行劝退处理</span>
              </div>
              <div class="detail-banner__meta">
                <span>累计违规：{{ totalViolationCount }} 次</span>
                <span>当前阶段：{{ currentStage?.stageName || detail.currentStageName || '-' }}</span>
              </div>
            </div>
            <NTabs v-model:value="activeTab" type="line" animated class="detail-tabs">
              <NTabPane name="overview" tab="基本信息">
                  <div class="detail-tab-pane">
                    <div class="detail-overview-grid">
                      <div class="detail-section">
                        <div class="detail-section__title">基本信息</div>
                        <InfoGridCard :items="basicInfoItems" />
                      </div>

                      <div class="detail-section">
                        <div class="detail-section__title">培训信息</div>
                        <InfoGridCard :items="trainingOverviewItems" />
                      </div>
                    </div>

                    <div class="detail-section">
                      <div class="detail-section__title">违规情况</div>
                      <div class="detail-banner violation-overview" :class="getViolationBannerClass()">
                        <div class="detail-banner__title">
                          <DictTag
                            v-if="latestViolationRecord?.violationType"
                            dict-code="assessment_violation_type"
                            :value="latestViolationRecord.violationType"
                          />
                          <NTag v-else size="small" :bordered="false" type="success">正常</NTag>
                          <span>{{ getViolationBannerText() }}</span>
                        </div>
                        <div class="detail-banner__meta">
                          <span>累计违规：{{ totalViolationCount }} 次</span>
                          <span>最近阶段：{{ resolveViolationStageName(latestViolationRecord) }}</span>
                          <span>最近时间：{{ latestViolationRecord?.violationAt || '-' }}</span>
                        </div>
                        <div v-if="latestViolationRecord?.description" class="detail-banner__desc">
                          最近说明：{{ latestViolationRecord.description }}
                        </div>
                        <div v-if="allViolationRecords.length > 1" class="violation-overview__list">
                          <div
                            v-for="record in allViolationRecords.slice(1, 4)"
                            :key="record.id || `${record.pathStageId}-${record.violationAt}`"
                            class="violation-overview__item"
                          >
                            <DictTag dict-code="assessment_violation_type" :value="record.violationType" />
                            <span class="violation-overview__stage">{{ resolveViolationStageName(record) }}</span>
                            <span class="violation-overview__time">{{ record.violationAt || '-' }}</span>
                            <span class="violation-overview__desc">{{ record.description || '-' }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
              </NTabPane>

              <NTabPane name="history" tab="培训履历">
                <div class="detail-tab-pane">
                  <div class="detail-section">
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
                                <DictTag
                                  size="small"
                                  dict-code="assessment_pass_result"
                                  :value="resolveAssessmentPassResult(stage.latestPaperStatus, stage.latestPaperPassFlag)"
                                  :fallback-label="getStageResultText(stage)"
                                />
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
                                {{ getEndStageButtonText(stage) }}
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
                              <div class="stage-summary__item">
                                阶段评级：
                                <DictTag
                                  dict-code="assessment_stage_rating"
                                  :value="stage.rating"
                                  :fallback-label="resolveStageRatingText(stage)"
                                  size="small"
                                />
                              </div>
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
                                      <DictTag
                                        dict-code="assessment_pass_result"
                                        :value="resolveAssessmentPassResult(record.status, record.passFlag)"
                                        :fallback-label="getRecordResultText(record)"
                                      />
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
                                      {{ record.status === 'pending_review' ? '阅卷' : '查看详情' }}
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
                          </div>
                        </div>
                      </div>
                    </div>

                    <NEmpty v-else description="暂无阶段信息" />
                  </div>

                </div>
              </NTabPane>

              <NTabPane name="daily" tab="日报">
                <div class="detail-tab-pane">
                  <div class="detail-section">
                    <PathDailyCalendar :calendar="dailyCalendar" />
                  </div>
                </div>
              </NTabPane>
            </NTabs>
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

      <PaperInfoModal :show="showPaperDialog" :paper-id="activePaperId" :readonly="activePaperReadonly" @close="handlePaperDialogClose" @refresh="handlePaperDialogRefresh" />

      <NModal
        :show="showDailyDetailDialog"
        preset="card"
        title="日报详情"
        :style="{ width: '760px', maxWidth: 'calc(100vw - 32px)' }"
        @update:show="value => !value && handleCloseDailyDetail()"
      >
        <div class="daily-detail-dialog" v-if="activeDailyCell">
          <div class="daily-detail-grid">
            <div class="daily-detail-grid__item">
              <span class="daily-detail-grid__label">日期</span>
              <span>{{ formatDateDay(activeDailyCell.date) }}</span>
            </div>
            <div class="daily-detail-grid__item">
              <span class="daily-detail-grid__label">阶段</span>
              <span>{{ activeDailyCell.stageName || '-' }}</span>
            </div>
            <div class="daily-detail-grid__item">
              <span class="daily-detail-grid__label">提交状态</span>
              <NTag size="small" :bordered="false" :type="getDailyStatusTagType(activeDailyCell.reportStatus)">
                {{ getDailyStatusText(activeDailyCell) }}
              </NTag>
            </div>
            <div class="daily-detail-grid__item">
              <span class="daily-detail-grid__label">是否节假日</span>
              <span>{{ activeDailyCell.holidayFlag ? '是' : '否' }}</span>
            </div>
            <div class="daily-detail-grid__item">
              <span class="daily-detail-grid__label">是否应提交</span>
              <span>{{ activeDailyCell.expectedReportFlag ? '是' : '否' }}</span>
            </div>
            <div class="daily-detail-grid__item">
              <span class="daily-detail-grid__label">阶段状态</span>
              <DictTag dict-code="assessment_path_stage_status" :value="activeDailyCell.stageStatus" />
            </div>
          </div>

          <div class="record-list">
            <div class="record-list__title">当日日报</div>

            <div v-if="activeDailyCell.reports?.length" class="record-items">
              <div v-for="report in activeDailyCell.reports" :key="report.id || report.reportDate" class="record-item record-item--daily">
                <div class="record-item__main">
                  <div class="record-item__title">
                    <span>{{ report.reportDate || '-' }}</span>
                    <NTag size="small" :bordered="false" type="success">已提交</NTag>
                  </div>
                  <div class="record-item__comment">今日内容：{{ report.content || '-' }}</div>
                  <div class="record-item__comment">问题反馈：{{ report.problem || '-' }}</div>
                  <div class="record-item__comment">次日计划：{{ report.plan || '-' }}</div>
                  <div class="record-item__comment">备注：{{ report.remark || '-' }}</div>
                  <div class="record-item__meta">
                    <span>更新时间：{{ report.updatedAt || report.createdAt || '-' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <NEmpty v-else description="当日暂无日报记录" />
          </div>
        </div>

        <template #action>
          <div class="stage-dialog-actions">
            <NButton @click="handleCloseDailyDetail">关闭</NButton>
          </div>
        </template>
      </NModal>

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
          <div class="stage-dialog-form__item stage-dialog-form__item--switch">
            <div class="stage-dialog-form__label">自动开始下一阶段</div>
            <div class="stage-dialog-switch">
              <span class="stage-dialog-switch__text">{{ stageEndForm.autoStartNext ? '开启' : '关闭' }}</span>
              <NSwitch v-model:value="stageEndForm.autoStartNext" />
            </div>
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
        :show="showFinalReviewDialog"
        preset="card"
        title="总体考评"
        :style="{ width: '900px', maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(100vh - 32px)' }"
        class="final-review-modal"
        @update:show="value => !value && (showFinalReviewDialog = false)"
      >
        <NSpin :show="finalReviewTemplateLoading">
          <div class="final-review-dialog">
            <div class="final-review-summary">
              <div>
                <div class="final-review-summary__label">总体考评模板</div>
                <div class="final-review-summary__title">{{ finalReviewTemplate?.name || detail?.finalTemplateName || '-' }}</div>
              </div>
              <div class="final-review-summary__score">
                {{ finalReviewTotalScore }} / {{ finalReviewMaxScore }}
              </div>
            </div>

            <div v-if="finalReviewGroupedItems.length" class="final-review-template">
              <div v-for="group in finalReviewGroupedItems" :key="group.key" class="final-review-dimension">
                <div class="final-review-dimension__header">
                  <div class="final-review-dimension__title">{{ group.name }}</div>
                  <NTag size="small" type="info" :bordered="false">{{ group.score }} / {{ group.maxScore }}</NTag>
                </div>

                <div class="final-review-item-list">
                  <div v-for="item in group.items" :key="item.itemId" class="final-review-item">
                    <div class="final-review-item__main">
                      <div class="final-review-item__name">{{ item.itemName || '-' }}</div>
                      <div v-if="item.itemDescription" class="final-review-item__desc">{{ item.itemDescription }}</div>
                    </div>
                    <div class="final-review-item__score">
                      <NInputNumber
                        v-model:value="item.score"
                        :min="0"
                        :max="Number(item.maxScore || 0)"
                        :precision="1"
                        clearable
                        placeholder="得分"
                      />
                      <span class="final-review-item__max">/ {{ item.maxScore || 0 }}</span>
                    </div>
                    <NInput v-model:value="item.comment" class="final-review-item__comment" clearable placeholder="小项说明（选填）" />
                  </div>
                </div>
              </div>
            </div>

            <NEmpty v-else description="当前总体考评模板暂无评分项" />

            <div class="final-review-footer-form">
              <div class="stage-dialog-form__item">
                <div class="stage-dialog-form__label">总体评级</div>
                <DictSelect v-model:model-value="finalReviewForm.rating" dict-code="assessment_stage_rating" />
              </div>
              <div class="stage-dialog-form__item stage-dialog-form__item--switch">
                <div class="stage-dialog-form__label">考评结果</div>
                <div class="stage-dialog-switch">
                  <span class="stage-dialog-switch__text">{{ finalReviewForm.passFlag ? '通过' : '未通过' }}</span>
                  <NSwitch v-model:value="finalReviewForm.passFlag" />
                </div>
              </div>
              <div class="stage-dialog-form__item final-review-comment">
                <div class="stage-dialog-form__label">考评说明</div>
                <NInput v-model:value="finalReviewForm.finalComment" type="textarea" :rows="3" placeholder="请输入总体考评说明" />
              </div>
            </div>
          </div>
        </NSpin>
        <template #action>
          <div class="stage-dialog-actions">
            <NButton @click="showFinalReviewDialog = false">取消</NButton>
            <NButton type="primary" :loading="actionLoadingStageId === 'final-review'" @click="handleFinalReviewSubmit">提交考评</NButton>
          </div>
        </template>
      </NModal>

      <NModal
        :show="showViolationDialog"
        preset="card"
        title="违规登记"
        :style="{ width: '640px', maxWidth: 'calc(100vw - 32px)' }"
        @update:show="value => !value && (showViolationDialog = false)"
      >
        <div class="stage-dialog-form">
          <div class="stage-dialog-form__item">
            <div class="stage-dialog-form__label">所属阶段</div>
            <NInput :value="editingViolationStage?.stageName || '-'" disabled />
          </div>
          <div class="stage-dialog-form__item">
            <div class="stage-dialog-form__label">违规类型</div>
            <DictSelect v-model:model-value="violationForm.violationType" dict-code="assessment_violation_type" />
          </div>
          <div class="stage-dialog-form__item">
            <div class="stage-dialog-form__label">违规时间</div>
            <NDatePicker v-model:value="violationForm.violationAt" type="datetime" clearable />
          </div>
          <div class="stage-dialog-form__item">
            <div class="stage-dialog-form__label">违规原因</div>
            <NInput v-model:value="violationForm.description" type="textarea" :rows="4" placeholder="请输入违规原因" />
          </div>
        </div>
        <template #action>
          <div class="stage-dialog-actions">
            <NButton @click="showViolationDialog = false">取消</NButton>
            <NButton type="primary" :loading="actionLoadingStageId === editingViolationStage?.id" @click="handleSaveViolation">保存</NButton>
          </div>
        </template>
      </NModal>

      <NModal
        :show="showExitDialog"
        preset="card"
        title="标记劝退"
        :style="{ width: '640px', maxWidth: 'calc(100vw - 32px)' }"
        @update:show="value => !value && (showExitDialog = false)"
      >
        <div class="stage-dialog-form">
          <div class="stage-dialog-form__item">
            <div class="stage-dialog-form__label">当前阶段</div>
            <NInput :value="currentStage?.stageName || detail?.currentStageName || '-'" disabled />
          </div>
          <div class="stage-dialog-form__item">
            <div class="stage-dialog-form__label">累计违规次数</div>
            <NInput :value="String(totalViolationCount)" disabled />
          </div>
          <div class="stage-dialog-form__item">
            <div class="stage-dialog-form__label">劝退理由</div>
            <NInput
              v-model:value="exitForm.reason"
              type="textarea"
              :rows="4"
              placeholder="请输入劝退理由"
            />
          </div>
        </div>
        <template #action>
          <div class="stage-dialog-actions">
            <NButton @click="showExitDialog = false">取消</NButton>
            <NButton type="primary" :loading="actionLoadingStageId === (currentStage?.id || detail?.id || 'exit')" @click="handleSaveExit">
              确认标记
            </NButton>
          </div>
        </template>
      </NModal>

      <NModal
        :show="showRetainDialog"
        preset="card"
        title="暂时保留"
        :style="{ width: '640px', maxWidth: 'calc(100vw - 32px)' }"
        @update:show="value => !value && (showRetainDialog = false)"
      >
        <div class="stage-dialog-form">
          <div class="stage-dialog-form__item">
            <div class="stage-dialog-form__label">当前阶段</div>
            <NInput :value="currentStage?.stageName || detail?.currentStageName || '-'" disabled />
          </div>
          <div class="stage-dialog-form__item">
            <div class="stage-dialog-form__label">累计违规次数</div>
            <NInput :value="String(totalViolationCount)" disabled />
          </div>
          <div class="stage-dialog-form__item">
            <div class="stage-dialog-form__label">保留原因</div>
            <NInput
              v-model:value="retainForm.reason"
              type="textarea"
              :rows="4"
              placeholder="请输入暂时保留原因"
            />
          </div>
        </div>
        <template #action>
          <div class="stage-dialog-actions">
            <NButton @click="showRetainDialog = false">取消</NButton>
            <NButton type="primary" :loading="actionLoadingStageId === 'retain-exit'" @click="submitExit('dismiss_retain')">
              确认保留
            </NButton>
          </div>
        </template>
      </NModal>
    </template>
  </InfoPageLayout>
</template>

<style scoped lang="scss">

.detail-page-tabs {
  min-width: 360px;
}

.detail-page-tabs:deep(.n-tabs-nav) {
  margin-bottom: 0;
  padding-bottom: 0;
}

.detail-page-tabs:deep(.n-tabs-tab) {
  padding-top: 0;
  padding-bottom: 0;
  font-size: 16px;
  font-weight: 600;
}

.detail-page-tabs:deep(.n-tabs-nav-scroll-wrapper) {
  padding-bottom: 0;
}

.detail-page-tabs:deep(.n-tabs-nav-scroll-content) {
  border-bottom: none !important;
}

.detail-page-tabs:deep(.n-tabs-nav__prefix),
.detail-page-tabs:deep(.n-tabs-nav__suffix) {
  border-bottom: none !important;
}

.detail-page-tabs:deep(.n-tabs-bar) {
  display: block;
}

.detail-page-tabs:deep(.n-tabs-pane-wrapper) {
  display: none !important;
  margin-top: 0 !important;
  padding-top: 0 !important;
}

.detail-page-tabs:deep(.n-tab-pane) {
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}

.detail-tabs {
  width: 100%;
}

.detail-tabs:deep(.n-tabs-nav) {
  display: none;
}

.detail-tabs:deep(.n-tabs-pane-wrapper) {
  margin-top: 0;
  padding-top: 0;
}

.detail-tabs:deep(.n-tab-pane) {
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}

.detail-tab-pane {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 0;
}

.daily-calendar-panel {
  padding: 18px;
  border-radius: 18px;
  background:
    linear-gradient(180deg, rgb(var(--container-bg-color)) 0%, rgb(var(--layout-bg-color)) 100%);
  box-shadow:
    inset 0 0 0 1px rgb(var(--border-color) / 92%),
    0 12px 30px rgb(15 23 42 / 6%);
}

.daily-calendar-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.daily-calendar-panel__title-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.daily-calendar-panel__eyebrow {
  color: var(--em-primary-color);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.daily-calendar-panel__title {
  color: var(--n-text-color-1);
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
}

.daily-calendar-panel__summary {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.daily-calendar-summary-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgb(var(--em-primary-color-rgb) / 0.08);
  box-shadow: inset 0 0 0 1px rgb(var(--em-primary-color-rgb) / 0.14);
}

.daily-calendar-summary-chip__label {
  color: var(--n-text-color-3);
  font-size: 12px;
}

.daily-calendar-summary-chip__value {
  color: var(--em-primary-color);
  font-size: 13px;
  font-weight: 700;
}

.daily-calendar-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 16px;
  margin-bottom: 14px;
}

.daily-calendar-legend__item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--n-text-color-2);
  font-size: 13px;
}

.daily-calendar-legend__dot {
  width: 14px;
  height: 14px;
  border: 1px solid transparent;
  border-radius: 4px;
  flex-shrink: 0;
}

.daily-calendar-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.daily-calendar-weekdays,
.daily-calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8px;
}

.daily-calendar-weekdays {
  position: sticky;
  top: 0;
  z-index: 1;
  margin-bottom: 12px;
  padding: 8px 10px;
  border-radius: 14px;
  background: rgb(var(--container-bg-color) / 92%);
  backdrop-filter: blur(12px);
  box-shadow: inset 0 0 0 1px rgb(var(--border-color) / 88%);
}

.daily-calendar-weekdays__item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 34px;
  border-radius: 10px;
  background: rgb(var(--em-primary-color-rgb) / 0.06);
  box-shadow: inset 0 0 0 1px rgb(var(--em-primary-color-rgb) / 0.08);
  color: var(--em-primary-color);
  font-size: 13px;
  font-weight: 700;
}

.daily-calendar-row {
  display: block;
}

.daily-calendar-cell {
  min-height: 84px;
  padding: 8px 9px;
  border: 1px solid rgb(var(--border-color) / 68%);
  border-radius: 14px;
  background: rgb(var(--container-bg-color));
  display: flex;
  flex-direction: column;
  gap: 4px;
  box-sizing: border-box;
  box-shadow:
    inset 0 0 0 1px rgb(255 255 255 / 2%),
    0 4px 14px rgb(15 23 42 / 4%);
}

.daily-calendar-cell--muted {
  background: rgb(244 246 248) !important;
  border-color: rgb(212 218 226) !important;
  color: rgb(124 132 144) !important;
  box-shadow:
    inset 0 0 0 1px rgb(224 229 236 / 92%),
    none;
}

html.dark .daily-calendar-cell--muted {
  background: rgb(36 40 46) !important;
  border-color: rgb(74 82 94) !important;
  color: rgb(146 154 166) !important;
  box-shadow:
    inset 0 0 0 1px rgb(84 92 104 / 88%),
    none;
}

.daily-calendar-cell--planned {
  background: color-mix(in srgb, var(--daily-stage-background, rgb(246 248 251)) 72%, rgb(244 246 248) 28%) !important;
  border-color: color-mix(in srgb, var(--daily-stage-border, rgb(216 222 230)) 72%, rgb(210 216 224) 28%) !important;
  color: color-mix(in srgb, var(--daily-stage-text, rgb(76 86 99)) 72%, rgb(92 100 112) 28%);
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--daily-stage-border, rgb(216 222 230)) 46%, rgb(226 231 238) 54%),
    0 4px 12px rgb(15 23 42 / 3%);
}

html.dark .daily-calendar-cell--planned {
  background: color-mix(in srgb, var(--daily-stage-background, rgb(34 39 46)) 58%, rgb(38 42 48) 42%) !important;
  border-color: color-mix(in srgb, var(--daily-stage-border, rgb(76 84 96)) 58%, rgb(82 90 102) 42%) !important;
  color: color-mix(in srgb, var(--daily-stage-text, rgb(184 192 204)) 68%, rgb(172 180 192) 32%);
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--daily-stage-border, rgb(76 84 96)) 48%, rgb(82 90 102) 52%),
    0 4px 12px rgb(0 0 0 / 16%);
}

.daily-calendar-cell--clickable {
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.daily-calendar-cell--clickable:hover {
  transform: translateY(-1px);
  box-shadow:
    inset 0 0 0 1px rgb(var(--em-primary-color-rgb) / 0.18),
    0 10px 22px rgb(var(--em-primary-color-rgb) / 0.08);
}

.daily-calendar-cell--planned.daily-calendar-cell--clickable:hover {
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--daily-stage-border, rgb(180 188 198)) 64%, rgb(176 184 194) 36%),
    0 8px 18px rgb(15 23 42 / 8%);
}

.daily-calendar-cell--empty {
  background: transparent;
  box-shadow: none;
  border-color: transparent;
}

.daily-calendar-cell--today {
  box-shadow:
    inset 0 0 0 1px rgb(var(--em-primary-color-rgb) / 0.42),
    0 0 0 3px rgb(var(--em-primary-color-rgb) / 0.1);
}

.daily-calendar-cell--overtime {
  box-shadow:
    inset 0 0 0 1px rgb(208 48 80 / 32%),
    0 0 0 2px rgb(208 48 80 / 10%);
}

.daily-calendar-cell__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 28px;
}

.daily-calendar-cell__date {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 1px;
}

.daily-calendar-cell__month {
  color: var(--daily-stage-sub-text, var(--n-text-color-3));
  font-size: 10px;
  line-height: 1.1;
  font-weight: 600;
}

.daily-calendar-cell__day {
  font-size: 14px;
  font-weight: 700;
  color: var(--daily-stage-text, var(--n-text-color-1));
  line-height: 1.15;
}

.daily-calendar-cell__stage {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.25;
  color: var(--daily-stage-text, var(--n-text-color-1));
}

.daily-calendar-cell__meta {
  color: var(--daily-stage-sub-text, var(--n-text-color-2));
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  font-size: 11px;
  line-height: 1.3;
  min-height: 28px;
}

.daily-calendar-cell__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: auto;
}

.daily-calendar-cell--muted .daily-calendar-cell__month,
.daily-calendar-cell--muted .daily-calendar-cell__meta {
  color: inherit;
}

.daily-calendar-cell--muted .daily-calendar-cell__day,
.daily-calendar-cell--muted .daily-calendar-cell__stage {
  color: rgb(86 94 106);
}

html.dark .daily-calendar-cell--muted .daily-calendar-cell__day,
html.dark .daily-calendar-cell--muted .daily-calendar-cell__stage {
  color: rgb(192 198 206);
}

.daily-calendar-cell--muted :deep(.n-tag) {
  background: rgb(229 233 238) !important;
  color: rgb(96 104 116) !important;
  box-shadow: inset 0 0 0 1px rgb(212 218 226 / 92%);
}

html.dark .daily-calendar-cell--muted :deep(.n-tag) {
  background: rgb(53 58 66) !important;
  color: rgb(172 178 186) !important;
  box-shadow: inset 0 0 0 1px rgb(84 92 104 / 88%);
}

.daily-calendar-cell :deep(.n-tag) {
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  font-size: 11px;
  line-height: 20px;
}

.daily-detail-dialog {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.daily-detail-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.daily-detail-grid__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: 12px;
  background: rgb(var(--layout-bg-color));
  box-shadow: inset 0 0 0 1px rgb(var(--border-color) / 85%);
}

.daily-detail-grid__label {
  flex: 0 0 84px;
  color: var(--n-text-color-3);
  font-size: 13px;
  line-height: 1.4;
}

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

.detail-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.detail-section__header:has(> :only-child) {
  justify-content: flex-end;
}

.detail-section__title {
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
}

.detail-section__header .detail-section__title {
  margin-bottom: 0;
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

.detail-banner {
  margin-bottom: 20px;
  padding: 16px 18px;
  border-radius: 14px;
  background: rgb(var(--container-bg-color));
  box-shadow:
    inset 0 0 0 1px rgb(var(--border-color)),
    0 1px 2px rgb(31 35 41 / 4%);
}

.detail-banner--warning {
  box-shadow:
    inset 0 0 0 1px rgb(240 160 32 / 32%),
    0 1px 2px rgb(31 35 41 / 4%);
  background: rgb(240 160 32 / 8%);
}

.detail-banner--error {
  box-shadow:
    inset 0 0 0 1px rgb(208 48 80 / 32%),
    0 1px 2px rgb(31 35 41 / 4%);
  background: rgb(208 48 80 / 8%);
}

.detail-banner--default {
  box-shadow:
    inset 0 0 0 1px rgb(var(--border-color)),
    0 1px 2px rgb(31 35 41 / 4%);
}

.detail-banner__title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 600;
}

.detail-banner__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 16px;
  margin-top: 10px;
  color: var(--n-text-color-3);
  font-size: 13px;
}

.detail-banner__desc {
  margin-top: 10px;
  color: var(--n-text-color-2);
  word-break: break-word;
}

.violation-overview {
  margin-bottom: 0;
}

.violation-overview__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.violation-overview__item {
  display: grid;
  grid-template-columns: auto minmax(88px, 0.8fr) minmax(140px, 1fr) minmax(160px, 2fr);
  align-items: center;
  gap: 10px;
  min-height: 34px;
  padding: 7px 10px;
  border-radius: 10px;
  background: rgb(var(--container-bg-color) / 72%);
  box-shadow: inset 0 0 0 1px rgb(var(--border-color) / 72%);
  color: var(--n-text-color-2);
  font-size: 13px;
}

.violation-overview__stage,
.violation-overview__time,
.violation-overview__desc {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.violation-overview__time {
  color: var(--n-text-color-3);
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

.record-item--daily {
  align-items: flex-start;
}

.stage-dialog-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stage-dialog-form__item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stage-dialog-form__item--switch {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.stage-dialog-form__label {
  font-size: 14px;
  font-weight: 500;
  color: var(--n-text-color-2);
}

.stage-dialog-form__item--switch .stage-dialog-form__label {
  flex: 1;
  min-width: 0;
}

.stage-dialog-switch {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-shrink: 0;
}

.stage-dialog-switch__text {
  font-size: 13px;
  line-height: 1;
  color: var(--n-text-color-3);
  min-width: 28px;
  text-align: right;
}

.stage-dialog-switch :deep(.n-switch) {
  flex-shrink: 0;
}

.stage-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
}

.final-review-dialog {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: calc(100vh - 210px);
  overflow-y: auto;
  padding-right: 4px;
}

.final-review-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border-radius: 14px;
  background: rgb(var(--layout-bg-color));
  box-shadow: inset 0 0 0 1px rgb(var(--border-color) / 85%);
}

.final-review-summary__label {
  color: var(--n-text-color-3);
  font-size: 12px;
  line-height: 1.3;
}

.final-review-summary__title {
  margin-top: 4px;
  color: var(--n-text-color-1);
  font-size: 16px;
  font-weight: 600;
}

.final-review-summary__score {
  color: var(--em-primary-color);
  font-size: 22px;
  font-weight: 700;
  white-space: nowrap;
}

.final-review-template {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.final-review-dimension {
  padding: 14px;
  border-radius: 14px;
  background: rgb(var(--container-bg-color));
  box-shadow:
    inset 0 0 0 1px rgb(var(--border-color)),
    0 1px 2px rgb(31 35 41 / 4%);
}

.final-review-dimension__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.final-review-dimension__title {
  font-size: 15px;
  font-weight: 600;
}

.final-review-item-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.final-review-item {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) 168px minmax(180px, 0.9fr);
  align-items: center;
  gap: 12px;
  min-height: 42px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgb(var(--layout-bg-color));
  box-shadow: inset 0 0 0 1px rgb(var(--border-color) / 72%);
}

.final-review-item__main {
  min-width: 0;
}

.final-review-item__name {
  overflow: hidden;
  color: var(--n-text-color-1);
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.final-review-item__desc {
  overflow: hidden;
  margin-top: 3px;
  color: var(--n-text-color-3);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.final-review-item__score {
  display: flex;
  align-items: center;
  gap: 8px;
}

.final-review-item__score :deep(.n-input-number) {
  width: 112px;
}

.final-review-item__max {
  color: var(--n-text-color-3);
  white-space: nowrap;
}

.final-review-footer-form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(160px, 0.8fr);
  gap: 16px;
}

.final-review-comment {
  grid-column: 1 / -1;
}

:deep(.final-review-modal > .n-card) {
  max-height: calc(100vh - 32px);
  display: flex;
  flex-direction: column;
}

:deep(.final-review-modal .n-card__content) {
  overflow: hidden;
}

.record-item__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.record-item__actions :deep(.n-button),
.record-list__empty :deep(.n-button) {
  min-width: 64px;
  height: 28px !important;
  padding: 0 12px !important;
  border-radius: 6px !important;
  font-size: 12px !important;
}

@media (width <= 960px) {
  .daily-calendar-panel__header {
    flex-direction: column;
  }

  .daily-calendar-panel__summary {
    justify-content: flex-start;
  }

  .detail-overview-grid {
    grid-template-columns: 1fr;
  }

  .daily-calendar-weekdays,
  .daily-calendar-grid {
    gap: 8px;
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

  .stage-summary {
    grid-template-columns: 1fr;
  }

  .daily-detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
