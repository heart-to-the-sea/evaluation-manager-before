<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { ArrowBackOutline, ChevronDownOutline, ChevronForwardOutline } from '@vicons/ionicons5';
import { NButton, NDatePicker, NEmpty, NIcon, NInput, NModal, NSpin, NSwitch, NTabPane, NTabs, NTag } from 'naive-ui';
import DictTag from '@/components/common/DictTag.vue';
import DictSelect from '@/components/common/DictSelect.vue';
import InfoGridCard from '@/components/common/InfoGridCard.vue';
import PaperCreateDialog from '@/components/features/intern-assessment/PaperCreateDialog.vue';
import PaperInfoModal from '@/components/features/intern-assessment/PaperInfoModal.vue';
import InfoPageLayout from '@/components/pages/InfoPageLayout.vue';
import {
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
  AssessmentInternPathStageVo,
  AssessmentInternPathVo,
  AssessmentPathDailyCalendarDayVo,
  AssessmentPathDailyCalendarVo,
  AssessmentPaperVo,
  AssessmentViolationRecordVo,
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
const showViolationDialog = ref(false);
const showExitDialog = ref(false);
const activePaperId = ref<string | null>(null);
const assessStage = ref<AssessmentInternPathStageVo | null>(null);
const actionLoadingStageId = ref('');
const endingStage = ref<AssessmentInternPathStageVo | null>(null);
const editingViolationStage = ref<AssessmentInternPathStageVo | null>(null);
const detail = ref<AssessmentInternPathVo | null>(null);
const userDetail = ref<UserVo | null>(null);
const paperRecords = ref<AssessmentPaperVo[]>([]);
const dailyCalendar = ref<AssessmentPathDailyCalendarVo | null>(null);
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

const violationForm = reactive({
  violationType: 'discipline',
  violationAt: null as number | null,
  description: ''
});

const exitForm = reactive({
  exitType: 'dismissed',
  reason: ''
});

const pathId = computed(() => String(route.params.id || ''));
const dailyCalendarWeekLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] as const;
const dailyStagePalette = [
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
] as const;

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
    const muted = !inTraining || Boolean(raw?.holidayFlag) || !raw?.pathStageId;
    const clickable = Boolean(raw && (raw.reports?.length || raw.pathStageId || raw.holidayFlag));
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
const isPathTerminated = computed(() => ['dismissed', 'voluntary_resigned'].includes(detail.value?.status || ''));
const isPathCompleted = computed(() => detail.value?.status === 'completed');
const canManageTraining = computed(() => !isPathCompleted.value && !isPathTerminated.value);
const totalViolationCount = computed(() =>
  Object.values(violationMap.value).reduce((total, records) => total + records.length, 0)
);
const currentStageViolations = computed(() => {
  const key = currentStage.value?.id || '';
  return key ? violationMap.value[key] || [] : [];
});
const latestExitRecord = computed(() => exitRecords.value[0] || null);
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
  { label: '入职状态', dictCode: 'employee_job_status', dictValue: userDetail.value?.jobStatus },
  { label: '工作状态', dictCode: 'employee_work_status', dictValue: userDetail.value?.workStatus },
  { label: '账号状态', dictCode: 'employee_account_status', dictValue: userDetail.value?.accountStatus },
  { label: '更新时间', text: userDetail.value?.updatedAt || detail.value?.updatedAt || '-' }
]);

const trainingOverviewItems = computed(() => [
  { label: '培训模板', text: detail.value?.templateName || '-' },
  { label: '培训开始时间', text: detail.value?.trainingStartDate || '-' },
  { label: '培训结束时间', text: detail.value?.trainingEndDate || '-' },
  { label: '当前培训阶段', text: detail.value?.currentStageName || '-' },
  { label: '培训状态', dictCode: 'assessment_path_status', dictValue: detail.value?.status },
  { label: '累计违规次数', text: String(totalViolationCount.value) },
  { label: '阶段数量', text: String(detail.value?.stages?.length || 0) },
  { label: '当前学习时间', text: resolveStudyDaysText(currentStage.value) },
  { label: '当前阶段时间状态', dictCode: 'assessment_stage_timing_status', dictValue: currentStage.value?.timingStatus },
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

function getExitRecordTagType(exitType?: string): 'error' | 'default' {
  return exitType === 'dismissed' ? 'error' : 'default';
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

function getDailyStatusTagType(status?: AssessmentPathDailyCalendarDayVo['reportStatus']): 'default' | 'success' | 'warning' | 'error' | 'info' {
  if (status === 'submitted') return 'success';
  if (status === 'pending') return 'error';
  if (status === 'holiday') return 'info';
  if (status === 'upcoming') return 'warning';
  return 'default';
}

function getDailyStatusText(day?: AssessmentPathDailyCalendarDayVo | null) {
  if (!day) return '-';
  if (day.reportStatus === 'submitted') return '已提交';
  if (day.reportStatus === 'pending') return '未提交';
  if (day.reportStatus === 'holiday') return '节假日';
  if (day.reportStatus === 'upcoming') return '待提交';
  return day.expectedReportFlag ? '待提交' : '无需提交';
}

function getDailyCellSummary(day?: AssessmentPathDailyCalendarDayVo | null) {
  if (!day) return '-';
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

async function handleSaveViolation() {
  if (!editingViolationStage.value?.id || !violationForm.description.trim()) return;
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

function openExitDialog(exitType: 'dismissed' | 'voluntary') {
  if (!detail.value?.userId) {
    window.$message?.warning('当前实习生信息不完整');
    return;
  }
  exitForm.exitType = exitType;
  exitForm.reason = '';
  showExitDialog.value = true;
}

async function handleSaveExit() {
  if (!detail.value?.userId) return;
  if (exitForm.exitType === 'dismissed' && !exitForm.reason.trim()) {
    window.$message?.warning('请输入劝退理由');
    return;
  }
  actionLoadingStageId.value = currentStage.value?.id || detail.value.id || 'exit';
  try {
    const { error, msg } = await fetchAssessmentPathExitSave({
      pathId: detail.value.id,
      pathStageId: currentStage.value?.id,
      userId: detail.value.userId,
      exitType: exitForm.exitType,
      reason: exitForm.reason.trim() || undefined
    });
    if (error) return;
    window.$message?.success(msg || '离场处理已保存');
    showExitDialog.value = false;
    await loadDetail();
  } finally {
    actionLoadingStageId.value = '';
  }
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
        type="primary"
        :disabled="!canAssessAction"
        :loading="Boolean(currentStage?.id && actionLoadingStageId === currentStage.id)"
        @click="handleAssessCurrentStage"
      >
        {{ currentAssessActionText }}
      </NButton>
      <NButton v-if="canManageTraining" secondary type="warning" :disabled="!currentStage?.id" @click="openViolationDialog()">
        违规登记
      </NButton>
      <NButton v-if="!isPathTerminated" secondary type="error" @click="openExitDialog('dismissed')">
        劝退处理
      </NButton>
      <NButton v-if="!isPathTerminated" @click="openExitDialog('voluntary')">
        主动离职
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
            <div v-if="latestExitRecord" class="detail-banner" :class="latestExitRecord.exitType === 'dismissed' ? 'detail-banner--error' : 'detail-banner--default'">
              <div class="detail-banner__title">
                <DictTag dict-code="assessment_exit_type" :value="latestExitRecord.exitType" />
                <span>{{ latestExitRecord.exitType === 'dismissed' ? '该实习生已完成劝退离场处理' : '该实习生已登记主动离职' }}</span>
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
                                      查看详情
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
                    <div class="daily-calendar-panel">
                      <div class="daily-calendar-panel__header">
                        <div class="daily-calendar-panel__title-group">
                          <div class="daily-calendar-panel__eyebrow">培训阶段日报追踪</div>
                          <div class="daily-calendar-panel__title">按实际培训区间连续展示</div>
                        </div>
                        <div class="daily-calendar-panel__summary">
                          <div v-for="item in dailyCalendarHeaderTags" :key="item.label" class="daily-calendar-summary-chip">
                            <span class="daily-calendar-summary-chip__label">{{ item.label }}</span>
                            <span class="daily-calendar-summary-chip__value">{{ item.value }}</span>
                          </div>
                        </div>
                      </div>

                      <div v-if="dailyStageLegend.length" class="daily-calendar-legend">
                        <div v-for="item in dailyStageLegend" :key="item.key" class="daily-calendar-legend__item">
                          <span
                            class="daily-calendar-legend__dot"
                            :style="{
                              background: item.color?.background || 'rgb(var(--em-primary-color-rgb) / 0.08)',
                              borderColor: item.color?.border || 'rgb(var(--em-primary-color-rgb) / 0.18)'
                            }"
                          ></span>
                          <span>{{ item.name }}</span>
                        </div>
                      </div>

                      <div class="daily-calendar-weekdays">
                        <div v-for="item in dailyCalendarWeekLabels" :key="item" class="daily-calendar-weekdays__item">{{ item }}</div>
                      </div>

                      <div v-if="dailyCalendarRows.length" class="daily-calendar-list">
                        <div v-for="row in dailyCalendarRows" :key="row.key" class="daily-calendar-row">
                          <div class="daily-calendar-grid">
                            <div
                              v-for="(cell, cellIndex) in row.cells"
                              :key="cell?.key || `empty-${row.key}-${cellIndex}`"
                              class="daily-calendar-cell"
                              :class="{
                                'daily-calendar-cell--today': cell?.isToday,
                                'daily-calendar-cell--clickable': Boolean(cell?.clickable),
                                'daily-calendar-cell--overtime': cell?.raw?.overtimeStageFlag,
                                'daily-calendar-cell--muted': cell?.muted
                              }"
                              :style="
                                cell && !cell.muted && cell.raw && getDailyStageKey(cell.raw)
                                  ? {
                                      '--daily-stage-text': cell.color?.text,
                                      '--daily-stage-sub-text': cell.color?.subText || cell.color?.text,
                                      background: cell.color?.background,
                                      borderColor: cell.color?.border
                                    }
                                : undefined
                              "
                              @click="cell?.clickable && openDailyDetail(cell.raw)"
                            >
                              <template v-if="cell">
                                <div class="daily-calendar-cell__head">
                                  <div class="daily-calendar-cell__date">
                                    <span class="daily-calendar-cell__month">{{ cell.monthText }}</span>
                                    <span class="daily-calendar-cell__day">{{ cell.dayText }}</span>
                                  </div>
                                  <NTag
                                    v-if="cell.raw"
                                    size="small"
                                    :bordered="false"
                                    :type="getDailyStatusTagType(cell.raw.reportStatus)"
                                  >
                                    {{ getDailyStatusText(cell.raw) }}
                                  </NTag>
                                </div>
                                <div class="daily-calendar-cell__stage">{{ cell.raw?.stageName || (cell.muted ? '非培训日' : '—') }}</div>
                                <div class="daily-calendar-cell__meta">
                                  {{ cell.raw ? getDailyCellSummary(cell.raw) : '未进入培训区间' }}
                                </div>
                                <div class="daily-calendar-cell__tags">
                                  <NTag v-if="cell.raw?.overtimeStageFlag" size="small" :bordered="false" type="error">超时</NTag>
                                  <NTag v-if="cell.raw?.holidayFlag" size="small" :bordered="false">节假日</NTag>
                                  <NTag v-else-if="cell.muted" size="small" :bordered="false">休息/空白</NTag>
                                </div>
                              </template>
                            </div>
                          </div>
                        </div>
                      </div>

                      <NEmpty v-else description="暂无日报日历数据" />
                    </div>
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

      <PaperInfoModal :show="showPaperDialog" :paper-id="activePaperId" :readonly="true" @close="handlePaperDialogClose" @refresh="handlePaperDialogRefresh" />

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
        title="离场处理"
        :style="{ width: '640px', maxWidth: 'calc(100vw - 32px)' }"
        @update:show="value => !value && (showExitDialog = false)"
      >
        <div class="stage-dialog-form">
          <div class="stage-dialog-form__item">
            <div class="stage-dialog-form__label">处理类型</div>
            <DictSelect v-model:model-value="exitForm.exitType" dict-code="assessment_exit_type" />
          </div>
          <div class="stage-dialog-form__item">
            <div class="stage-dialog-form__label">当前阶段</div>
            <NInput :value="currentStage?.stageName || detail?.currentStageName || '-'" disabled />
          </div>
          <div class="stage-dialog-form__item">
            <div class="stage-dialog-form__label">累计违规次数</div>
            <NInput :value="String(totalViolationCount)" disabled />
          </div>
          <div class="stage-dialog-form__item">
            <div class="stage-dialog-form__label">{{ exitForm.exitType === 'dismissed' ? '劝退理由' : '备注说明' }}</div>
            <NInput
              v-model:value="exitForm.reason"
              type="textarea"
              :rows="4"
              :placeholder="exitForm.exitType === 'dismissed' ? '请输入劝退理由' : '可填写主动离职说明'"
            />
          </div>
        </div>
        <template #action>
          <div class="stage-dialog-actions">
            <NButton @click="showExitDialog = false">取消</NButton>
            <NButton type="primary" :loading="actionLoadingStageId === (currentStage?.id || detail?.id || 'exit')" @click="handleSaveExit">
              确认提交
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

.stage-dialog-form__label {
  font-size: 14px;
  font-weight: 500;
  color: var(--n-text-color-2);
}

.stage-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
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

