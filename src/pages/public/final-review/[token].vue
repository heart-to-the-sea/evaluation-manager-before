<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { CheckmarkCircleOutline } from '@vicons/ionicons5';
import { NButton, NEmpty, NIcon, NInput, NInputNumber, NModal, NSelect, NSpin, NTabPane, NTabs, NTag } from 'naive-ui';
import DictTag from '@/components/common/DictTag.vue';
import InfoGridCard from '@/components/common/InfoGridCard.vue';
import PathDailyCalendar from '@/components/features/intern-assessment/PathDailyCalendar.vue';
import {
  fetchAssessmentFinalReviewLinkDetail,
  fetchAssessmentFinalReviewPaperDetail,
  fetchAssessmentFinalReviewPublicSubmit,
  fetchAssessmentFinalReviewReviewerOptions
} from '@/service/api';
import type {
  AssessmentFinalReviewPublicDetailVo,
  AssessmentFinalTemplateVo,
  AssessmentInternPathStageVo,
  AssessmentPaperVo,
  AssessmentPathDailyCalendarDayVo,
  UserOptionVo
} from '@/types/app';
import {
  getAssessmentPassResultLabel,
  getAssessmentReviewResultLabel,
  normalizeAssessmentReviewResult,
  resolveAssessmentPassResult
} from '@/utils/assessment-dict';

definePageMeta({
  layout: false,
  title: '总体考评'
});

type ReviewItem = {
  dimensionId?: string;
  dimensionName?: string;
  itemId?: string;
  itemName?: string;
  itemDescription?: string;
  maxScore?: number | string;
  score: number | null;
  comment: string;
};

type StageWithRecords = AssessmentInternPathStageVo & {
  records: AssessmentPaperVo[];
};

type DailyStageColor = {
  background: string;
  border: string;
  text: string;
  subText: string;
};

type DailyCell = {
  key: string;
  isToday: boolean;
  dateText: string;
  monthText: string;
  dayText: string;
  raw: AssessmentPathDailyCalendarDayVo | null;
  color?: DailyStageColor;
  muted: boolean;
  clickable: boolean;
};

type InfoItem = {
  label: string;
  value: string;
  dictCode?: string;
  dictValue?: string | number | null;
  fallbackLabel?: string;
};

const route = useRoute();
const token = computed(() => String(route.params.token || ''));
const loading = ref(false);
const submitting = ref(false);
const submitted = ref(false);
const activeTab = ref<'overview' | 'history' | 'daily'>('overview');
const paperDetailLoading = ref(false);
const showPaperDetailDialog = ref(false);
const activePaperDetail = ref<AssessmentPaperVo | null>(null);
const showDailyDetailDialog = ref(false);
const activeDailyCell = ref<AssessmentPathDailyCalendarDayVo | null>(null);
const detail = ref<AssessmentFinalReviewPublicDetailVo | null>(null);
const reviewerOptions = ref<UserOptionVo[]>([]);
const reviewerUserId = ref<string | null>(null);
const comment = ref('');
const reviewItems = ref<ReviewItem[]>([]);

const dailyCalendarWeekLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] as const;
const dailyStagePalette: DailyStageColor[] = [
  {
    background: 'rgb(var(--em-primary-color-rgb) / 0.14)',
    border: 'rgb(var(--em-primary-color-rgb) / 0.28)',
    text: 'var(--em-primary-color)',
    subText: 'rgb(var(--em-primary-color-rgb) / 0.78)'
  },
  {
    background: 'rgb(var(--em-primary-color-rgb) / 0.1)',
    border: 'rgb(var(--em-primary-color-rgb) / 0.22)',
    text: 'rgb(var(--em-primary-color-rgb) / 0.9)',
    subText: 'rgb(var(--em-primary-color-rgb) / 0.7)'
  },
  {
    background: 'rgb(var(--em-primary-color-rgb) / 0.07)',
    border: 'rgb(var(--em-primary-color-rgb) / 0.18)',
    text: 'rgb(var(--em-primary-color-rgb) / 0.84)',
    subText: 'rgb(var(--em-primary-color-rgb) / 0.64)'
  }
];

const pathDetail = computed(() => detail.value?.path || null);
const userDetail = computed(() => detail.value?.user || null);
const finalTemplate = computed(() => detail.value?.finalTemplate || null);
const paperRecords = computed(() => detail.value?.paperRecords || []);
const dailyCalendar = computed(() => detail.value?.dailyCalendar || null);
const violationRecords = computed(() => detail.value?.violationRecords || []);
const exitRecords = computed(() => detail.value?.exitRecords || []);
const latestViolationRecord = computed(() => {
  const records = [...violationRecords.value];
  if (!records.length) return null;
  records.sort((left, right) => String(right.violationAt || '').localeCompare(String(left.violationAt || '')));
  return records[0] || null;
});
const totalViolationCount = computed(() => violationRecords.value.length);

const reviewerSelectOptions = computed(() =>
  reviewerOptions.value.map(item => ({
    label: `${item.name || item.account || '-'}${item.employeeNo ? `（${item.employeeNo}）` : ''}`,
    value: item.id || ''
  }))
);

const basicInfoItems = computed<InfoItem[]>(() => [
  { label: '学员', value: pathDetail.value?.userName || userDetail.value?.name || userDetail.value?.username || '-' },
  { label: '工号', value: pathDetail.value?.employeeNo || userDetail.value?.employeeNo || '-' },
  { label: '账号', value: userDetail.value?.account || '-' },
  { label: '性别', value: resolveGenderText(userDetail.value?.gender) },
  { label: '手机号', value: userDetail.value?.phone || '-' },
  { label: '邮箱', value: userDetail.value?.email || '-' },
  { label: '岗位', value: userDetail.value?.positionNameLabel || userDetail.value?.positionName || '-' },
  { label: '入职日期', value: formatDateDay(userDetail.value?.entryDate) }
]);

const trainingInfoItems = computed<InfoItem[]>(() => [
  { label: '培训模板', value: pathDetail.value?.templateName || '-' },
  { label: '总体考评模板', value: pathDetail.value?.finalTemplateName || finalTemplate.value?.name || '-' },
  { label: '培训开始', value: formatDateDay(pathDetail.value?.trainingStartDate) },
  { label: '培训结束', value: formatDateDay(pathDetail.value?.trainingEndDate) },
  { label: '当前阶段', value: pathDetail.value?.currentStageName || '-' },
  {
    label: '培训状态',
    value: pathDetail.value?.statusLabel || resolvePathStatusText(pathDetail.value?.status),
    dictCode: 'assessment_path_status',
    dictValue: pathDetail.value?.status,
    fallbackLabel: pathDetail.value?.statusLabel || resolvePathStatusText(pathDetail.value?.status)
  },
  {
    label: '总体评级',
    value: pathDetail.value?.finalRatingLabel || pathDetail.value?.finalRating || '-',
    dictCode: 'assessment_stage_rating',
    dictValue: pathDetail.value?.finalRating,
    fallbackLabel: pathDetail.value?.finalRatingLabel || pathDetail.value?.finalRating || '-'
  },
  { label: '总体得分', value: pathDetail.value?.finalScore == null ? '-' : String(pathDetail.value.finalScore) },
  {
    label: '总体结果',
    value: pathDetail.value?.finalPassFlag == null ? '-' : pathDetail.value.finalPassFlag ? '通过' : '未通过',
    dictCode: 'assessment_pass_result',
    dictValue: pathDetail.value?.finalPassFlag == null ? 'pending' : pathDetail.value.finalPassFlag ? 'passed' : 'failed',
    fallbackLabel: pathDetail.value?.finalPassFlag == null ? '-' : pathDetail.value.finalPassFlag ? '通过' : '未通过'
  },
  { label: '总体考评时间', value: formatDateTime(pathDetail.value?.finalReviewedAt) },
  { label: '总体说明', value: pathDetail.value?.finalComment || '-' },
  { label: '阶段数量', value: String(pathDetail.value?.stages?.length || 0) }
]);

const basicInfoGridItems = computed(() =>
  basicInfoItems.value.map(item => ({
    label: item.label,
    text: item.value
  }))
);

const trainingInfoGridItems = computed(() =>
  trainingInfoItems.value.map(item => ({
    label: item.label,
    text: item.value,
    dictCode: item.dictCode,
    dictValue: item.dictValue,
    fallbackLabel: item.fallbackLabel
  }))
);

const finalReviewTotalScore = computed(() =>
  reviewItems.value.reduce((total, item) => total + Number(item.score || 0), 0)
);

const finalReviewMaxScore = computed(() =>
  reviewItems.value.reduce((total, item) => total + Number(item.maxScore || 0), 0)
);

const groupedItems = computed(() => {
  const groups = new Map<string, {
    key: string;
    name: string;
    maxScore: number;
    score: number;
    items: ReviewItem[];
  }>();
  reviewItems.value.forEach(item => {
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

const stageRecords = computed<StageWithRecords[]>(() => {
  const recordMap = new Map<string, AssessmentPaperVo[]>();
  paperRecords.value.forEach(record => {
    const key = record.pathStageId || record.stageId || '';
    if (!key) return;
    const list = recordMap.get(key) || [];
    list.push(record);
    recordMap.set(key, list);
  });

  return (pathDetail.value?.stages || []).map(stage => ({
    ...stage,
    records: [...(recordMap.get(stage.id || stage.stageId || '') || [])].sort((left, right) =>
      String(right.createdAt || '').localeCompare(String(left.createdAt || ''))
    )
  }));
});

const dailyStageColorMap = computed(() => {
  const map = new Map<string, DailyStageColor>();
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
      new Map<string, { key: string; name: string; color?: DailyStageColor }>()
    ).values()
  )
);

const dailyCalendarRows = computed<Array<{ key: string; cells: DailyCell[] }>>(() => {
  const dayList = dailyCalendar.value?.days || [];
  if (!dayList.length) return [];
  const dayMap = new Map(dayList.map(item => [formatDateDay(item.date), item] as const));
  const startDate = createDateByText(formatDateDay(dailyCalendar.value?.startDate));
  const endDate = createDateByText(formatDateDay(dailyCalendar.value?.endDate));
  if (!startDate || !endDate) return [];

  const calendarStart = new Date(startDate);
  calendarStart.setDate(calendarStart.getDate() - ((calendarStart.getDay() + 6) % 7));

  const calendarEnd = new Date(endDate);
  calendarEnd.setDate(calendarEnd.getDate() + ((7 - ((calendarEnd.getDay() + 6) % 7) - 1 + 7) % 7));

  const cells: DailyCell[] = [];
  const cursor = new Date(calendarStart);
  const startText = formatDateToText(startDate);
  const endText = formatDateToText(endDate);
  while (cursor.getTime() <= calendarEnd.getTime()) {
    const dateText = formatDateToText(cursor);
    const raw = dayMap.get(dateText) || null;
    const inTraining = dateText >= startText && dateText <= endText;
    const hasStageSchedule = Boolean(raw?.pathStageId || raw?.stageId || raw?.stageName);
    const muted = !inTraining || Boolean(raw?.holidayFlag) || !hasStageSchedule;
    cells.push({
      key: dateText,
      isToday: dateText === formatDateDay(new Date().toISOString()),
      dateText,
      monthText: `${Number(dateText.slice(5, 7))}月`,
      dayText: `${Number(dateText.slice(8, 10))}日`,
      raw,
      color: raw ? dailyStageColorMap.value.get(getDailyStageKey(raw)) : undefined,
      muted,
      clickable: Boolean(raw && (raw.reports?.length || raw.pathStageId || raw.stageId || raw.holidayFlag))
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  const rows: Array<{ key: string; cells: DailyCell[] }> = [];
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
  return [
    { label: '培训区间', value: `${formatDateDay(dailyCalendar.value?.startDate)} ~ ${formatDateDay(dailyCalendar.value?.endDate)}` },
    { label: '阶段数', value: `${dailyStageLegend.value.length}` },
    { label: '已提交', value: `${days.filter(item => item.reportStatus === 'submitted').length}` },
    { label: '未提交', value: `${days.filter(item => item.reportStatus === 'pending').length}` },
    { label: '超时天数', value: `${days.filter(item => item.overtimeStageFlag).length}` }
  ];
});

onMounted(() => {
  loadData();
});

function buildItemsFromTemplate(template?: AssessmentFinalTemplateVo | null) {
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

async function loadData() {
  loading.value = true;
  try {
    const [detailResponse, reviewerResponse] = await Promise.all([
      fetchAssessmentFinalReviewLinkDetail(token.value),
      fetchAssessmentFinalReviewReviewerOptions(token.value)
    ]);
    if (!detailResponse.error) {
      detail.value = detailResponse.data;
      reviewItems.value = buildItemsFromTemplate(detailResponse.data?.finalTemplate);
    }
    reviewerOptions.value = reviewerResponse.error ? [] : reviewerResponse.data || [];
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  if (!reviewerUserId.value) {
    window.$message?.warning('请选择评分人');
    return;
  }
  const unfinishedItem = reviewItems.value.find(item => item.score === null || item.score === undefined);
  if (unfinishedItem) {
    window.$message?.warning(`请填写「${unfinishedItem.itemName || '评分项'}」得分`);
    return;
  }
  const invalidItem = reviewItems.value.find(item => Number(item.score) < 0 || Number(item.score) > Number(item.maxScore || 0));
  if (invalidItem) {
    window.$message?.warning(`「${invalidItem.itemName || '评分项'}」得分需在 0 到 ${invalidItem.maxScore || 0} 之间`);
    return;
  }
  submitting.value = true;
  try {
    const { error, msg } = await fetchAssessmentFinalReviewPublicSubmit({
      token: token.value,
      reviewerUserId: reviewerUserId.value,
      comment: comment.value.trim() || undefined,
      finalItems: reviewItems.value.map(item => ({
        dimensionId: item.dimensionId,
        itemId: item.itemId,
        score: item.score,
        comment: item.comment.trim() || undefined
      }))
    });
    if (error) return;
    submitted.value = true;
    window.$message?.success(msg || '总体考评提交成功');
  } finally {
    submitting.value = false;
  }
}

async function openPaperDetail(record: AssessmentPaperVo) {
  if (!record.id) return;
  showPaperDetailDialog.value = true;
  activePaperDetail.value = null;
  paperDetailLoading.value = true;
  try {
    const { data, error } = await fetchAssessmentFinalReviewPaperDetail(token.value, record.id);
    if (error || !data) {
      showPaperDetailDialog.value = false;
      return;
    }
    activePaperDetail.value = data;
  } finally {
    paperDetailLoading.value = false;
  }
}

function closePaperDetail() {
  showPaperDetailDialog.value = false;
  activePaperDetail.value = null;
}

function openDailyDetail(day: AssessmentPathDailyCalendarDayVo | null) {
  if (!day) return;
  activeDailyCell.value = day;
  showDailyDetailDialog.value = true;
}

function closeDailyDetail() {
  activeDailyCell.value = null;
  showDailyDetailDialog.value = false;
}

function getDailyStageKey(day?: Pick<AssessmentPathDailyCalendarDayVo, 'pathStageId' | 'stageId'> | null) {
  return day?.pathStageId || day?.stageId || '';
}

function formatDateDay(value?: string | Date | null) {
  if (!value) return '-';
  if (value instanceof Date) return formatDateToText(value);
  return String(value).replace('T', ' ').slice(0, 10);
}

function formatDateTime(value?: string | Date | null) {
  if (!value) return '-';
  if (value instanceof Date) return value.toLocaleString();
  return String(value).replace('T', ' ').slice(0, 19);
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

function resolveGenderText(value?: string) {
  if (value === '1' || value === 'male') return '男';
  if (value === '2' || value === 'female') return '女';
  return value || '-';
}

function resolvePathStatusText(value?: string) {
  const map: Record<string, string> = {
    not_started: '未开始',
    in_progress: '培训中',
    pending_review: '待考核',
    pending_final_review: '待总体考评',
    final_failed: '总体考评未通过',
    completed: '已完成',
    dismiss_pending: '已标记劝退',
    dismissed: '已劝退',
    voluntary_resigned: '主动离职'
  };
  return value ? map[value] || value : '-';
}

function resolveStageStatusText(value?: string) {
  const map: Record<string, string> = {
    pending: '未开始',
    in_progress: '培训中',
    pending_review: '待考核',
    passed: '已通过',
    failed: '未通过',
    ended: '已结束',
    skipped: '已跳过'
  };
  return value ? map[value] || value : '-';
}

function getStageStatusType(value?: string) {
  if (value === 'passed') return 'success';
  if (value === 'failed') return 'error';
  if (value === 'pending_review') return 'warning';
  if (value === 'in_progress') return 'info';
  return 'default';
}

function getStageDotClass(stage: AssessmentInternPathStageVo) {
  if (stage.timingStatus === 'overdue' || stage.timingStatus === 'assessed_overdue') return 'is-error';
  if (stage.status === 'passed') return 'is-success';
  if (stage.status === 'in_progress' || stage.status === 'pending_review') {
    return stage.violationFlag ? 'is-warning' : 'is-info';
  }
  if (stage.status === 'failed') return 'is-error';
  if (stage.status === 'skipped') return 'is-info';
  return 'is-default';
}

function getStageStatusFallbackLabel(value?: string) {
  const map: Record<string, string> = {
    pending: '未开始',
    in_progress: '培训中',
    pending_review: '待考核',
    passed: '已通过',
    failed: '未通过',
    ended: '已结束',
    skipped: '已跳过'
  };
  return value ? map[value] || value : '-';
}

function getStageRatingFallbackLabel(stage: AssessmentInternPathStageVo) {
  return (stage as AssessmentInternPathStageVo & { ratingLabel?: string }).ratingLabel || stage.rating || '-';
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

function resolveStudyDaysText(stage?: AssessmentInternPathStageVo | null) {
  if (!stage) return '-';
  if (stage.minStudyDays == null && stage.maxStudyDays == null) return '未配置';
  if (stage.minStudyDays != null && stage.maxStudyDays != null) return `${stage.minStudyDays}-${stage.maxStudyDays}天`;
  if (stage.minStudyDays != null) return `不少于${stage.minStudyDays}天`;
  return `不超过${stage.maxStudyDays}天`;
}

function resolveFlagText(value?: boolean | null) {
  if (value === true) return '是';
  if (value === false) return '否';
  return '-';
}

function resolveStageDurationSummary(stage?: AssessmentInternPathStageVo | null) {
  if (!stage) return '-';
  if (stage.overtimeFlag) return '已超时';
  if (stage.endedAt) return '已结束';
  if (stage.startedAt) return '进行中';
  return '待开始';
}

function getStageDurationTagType(stage?: AssessmentInternPathStageVo | null): 'default' | 'success' | 'warning' | 'error' | 'info' {
  if (!stage) return 'default';
  if (stage.overtimeFlag) return 'error';
  if (stage.endedAt) return 'success';
  if (stage.startedAt) return 'info';
  return 'default';
}

function resolveStagePeriodText(stage?: AssessmentInternPathStageVo | null) {
  if (!stage) return '-';
  const start = formatDateDay(stage.startedAt);
  const end = formatDateDay(stage.endedAt);
  if (start === '-' && end === '-') return '-';
  if (start === '-') return `至 ${end}`;
  if (end === '-') return `${start} 至今`;
  return `${start} 至 ${end}`;
}

function getPaperStatusFallbackLabel(value?: string) {
  const map: Record<string, string> = {
    draft: '草稿',
    pending_review: '待批阅',
    reviewed: '已批阅'
  };
  return value ? map[value] || value : '-';
}

function getViolationTypeFallbackLabel(value?: string) {
  const map: Record<string, string> = {
    exam: '考试违规',
    discipline: '纪律违规',
    attendance: '考勤违规'
  };
  return value ? map[value] || value : '违规';
}

function getExitTypeFallbackLabel(value?: string) {
  const map: Record<string, string> = {
    dismiss_pending: '标记劝退',
    dismissed: '确认劝退离场',
    dismiss_cancel: '取消劝退',
    dismiss_retain: '暂时保留',
    voluntary: '主动离职'
  };
  return value ? map[value] || value : '-';
}

function resolveStageRatingText(stage: AssessmentInternPathStageVo) {
  return (stage as AssessmentInternPathStageVo & { ratingLabel?: string }).ratingLabel || stage.rating || '-';
}

function resolveActualStudyDaysText(stage: AssessmentInternPathStageVo) {
  const value = (stage as AssessmentInternPathStageVo & { actualStudyDays?: number }).actualStudyDays;
  return value == null ? '-' : `${value} 天`;
}

function resolvePaperStatusText(value?: string) {
  const map: Record<string, string> = {
    draft: '草稿',
    pending_review: '待批阅',
    reviewed: '已批阅'
  };
  return value ? map[value] || value : '-';
}

function getPaperStatusType(value?: string) {
  if (value === 'reviewed') return 'success';
  if (value === 'pending_review') return 'warning';
  return 'default';
}

function getPaperPassType(record?: AssessmentPaperVo | null): 'default' | 'success' | 'warning' | 'error' | 'info' {
  if (record?.status === 'pending_review') return 'warning';
  if (record?.passFlag === true) return 'success';
  if (record?.passFlag === false) return 'error';
  return 'default';
}

function getPaperPassText(record?: AssessmentPaperVo | null) {
  return getAssessmentPassResultLabel(record?.status, record?.passFlag);
}

function getQuestionResultText(result?: string | null) {
  return getAssessmentReviewResultLabel(result);
}

function getQuestionResultType(result?: string | null): 'default' | 'success' | 'warning' | 'error' | 'info' {
  if (result === 'correct') return 'success';
  if (result === 'wrong') return 'error';
  if (result === 'partial') return 'warning';
  return 'default';
}

function formatQuestionOptions(optionSnapshot?: string | null) {
  if (!optionSnapshot) return '';
  try {
    const parsed = JSON.parse(optionSnapshot);
    if (Array.isArray(parsed)) {
      return parsed.map((item: any) => `${item.label || item.optionLabel || ''}.${item.content || item.optionContent || ''}`).join('；');
    }
  } catch {
    return optionSnapshot;
  }
  return optionSnapshot;
}

function resolveViolationTypeText(value?: string) {
  const map: Record<string, string> = {
    exam: '考试违规',
    discipline: '纪律违规',
    attendance: '考勤违规'
  };
  return value ? map[value] || value : '违规';
}

function resolveExitTypeText(value?: string) {
  const map: Record<string, string> = {
    dismiss_pending: '标记劝退',
    dismissed: '确认劝退离场',
    dismiss_cancel: '取消劝退',
    dismiss_retain: '暂时保留',
    voluntary: '主动离职'
  };
  return value ? map[value] || value : '-';
}

function getViolationBannerClass() {
  if (totalViolationCount.value > 2) return 'detail-banner--error';
  if (totalViolationCount.value > 0) return 'detail-banner--warning';
  return 'detail-banner--default';
}

function getViolationBannerText() {
  if (totalViolationCount.value > 2) return '累计违规已超过 2 次，建议立即进行劝退处理';
  if (totalViolationCount.value > 0) return '当前存在违规登记，请重点关注本阶段表现';
  return '当前暂无违规登记';
}

function resolveViolationStageName(record?: { stageName?: string | null } | null) {
  return record?.stageName || '-';
}

function getDailyStatusText(day?: AssessmentPathDailyCalendarDayVo | null) {
  if (!day) return '-';
  if (day.reportStatus === 'submitted') return '已提交';
  if (day.reportStatus === 'pending') return '未提交';
  if (day.reportStatus === 'upcoming') return '待提交';
  if (day.reportStatus === 'holiday') return '休息日';
  return day.holidayFlag ? '休息日' : '空白';
}

function getDailyStatusTagType(status?: string) {
  if (status === 'submitted') return 'success';
  if (status === 'pending') return 'error';
  if (status === 'upcoming') return 'warning';
  return 'default';
}

function getDailyCellSummary(day: AssessmentPathDailyCalendarDayVo) {
  if (day.reports?.length) return `日报 ${day.reports.length} 条`;
  if (day.holidayFlag) return '节假日/休息日';
  if (day.expectedReportFlag) return '应提交日报';
  return '无需提交';
}
</script>

<template>
  <div class="public-review-page">
    <header class="public-review-header">
      <div>
        <h1>总体考评</h1>
        <p>左侧查看完整培训详情，右侧选择自己的账户完成独立评分。</p>
      </div>
      <NTag size="large" type="info" :bordered="false">有效期至：{{ formatDateTime(detail?.expireAt) }}</NTag>
    </header>

    <NSpin :show="loading" class="public-review-spin">
      <div v-if="detail && !submitted" class="public-review-grid">
        <section class="public-review-card public-review-card--detail">
          <NTabs v-model:value="activeTab" type="line" animated class="public-detail-tabs">
            <NTabPane name="overview" tab="基本信息">
              <div class="public-tab-pane">
                <div class="detail-overview-grid">
                  <div class="detail-section detail-section--boxed">
                    <div class="detail-section__title">基本信息</div>
                    <InfoGridCard :items="basicInfoGridItems" :plain="true" />
                  </div>

                  <div class="detail-section detail-section--boxed">
                    <div class="detail-section__title">培训信息</div>
                    <InfoGridCard :items="trainingInfoGridItems" :plain="true" />
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
                        :fallback-label="getViolationTypeFallbackLabel(latestViolationRecord.violationType)"
                      />
                      <NTag v-else size="small" :bordered="false" type="success">正常</NTag>
                      <span>{{ getViolationBannerText() }}</span>
                    </div>
                    <div class="detail-banner__meta">
                      <span>累计违规：{{ totalViolationCount }} 次</span>
                      <span>最近阶段：{{ resolveViolationStageName(latestViolationRecord) }}</span>
                      <span>最近时间：{{ formatDateTime(latestViolationRecord?.violationAt) }}</span>
                    </div>
                    <div v-if="latestViolationRecord?.description" class="detail-banner__desc">
                      最近说明：{{ latestViolationRecord.description }}
                    </div>
                    <div v-if="violationRecords.length > 1" class="violation-overview__list">
                      <div v-for="record in violationRecords.slice(1, 4)" :key="record.id" class="violation-overview__item">
                        <DictTag
                          dict-code="assessment_violation_type"
                          :value="record.violationType"
                          :fallback-label="getViolationTypeFallbackLabel(record.violationType)"
                        />
                        <span class="violation-overview__stage">{{ resolveViolationStageName(record) }}</span>
                        <span class="violation-overview__time">{{ formatDateTime(record.violationAt) }}</span>
                        <span class="violation-overview__desc">{{ record.description || '-' }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </NTabPane>

            <NTabPane name="history" tab="培训履历">
              <div class="public-tab-pane">
                <div class="detail-section">
                  <div v-if="stageRecords.length" class="stage-list">
                    <div v-for="(stage, index) in stageRecords" :key="stage.id || stage.stageId || index" class="stage-item">
                      <div class="stage-item__rail">
                        <div class="stage-dot" :class="getStageDotClass(stage)"></div>
                        <div v-if="index < stageRecords.length - 1" class="stage-line"></div>
                      </div>

                      <div class="stage-item__body">
                        <div class="stage-item__header stage-item__header--readonly">
                          <div class="stage-item__title">
                            <span>{{ stage.stageName || '-' }}</span>
                            <DictTag
                              dict-code="assessment_path_stage_status"
                              :value="stage.status"
                              :fallback-label="getStageStatusFallbackLabel(stage.status)"
                            />
                            <DictTag
                              dict-code="assessment_stage_timing_status"
                              :value="stage.timingStatus"
                              :fallback-label="stage.timingStatusLabel || stage.timingStatus || '-'"
                            />
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
                                size="small"
                                dict-code="assessment_stage_rating"
                                :value="stage.rating"
                                :fallback-label="getStageRatingFallbackLabel(stage)"
                              />
                            </div>
                          </div>
                        </div>

                        <div class="stage-item__detail">
                          <div class="stage-summary">
                            <div class="stage-summary__item">学习时间：{{ resolveStudyDaysText(stage) }}</div>
                            <div class="stage-summary__item">培训开始：{{ formatDateTime(stage.startedAt) }}</div>
                            <div class="stage-summary__item">培训结束：{{ formatDateTime(stage.endedAt) }}</div>
                            <div class="stage-summary__item">实际学习天数：{{ resolveActualStudyDaysText(stage) }}</div>
                            <div class="stage-summary__item">考核时间：{{ formatDateTime(stage.assessAt) }}</div>
                            <div class="stage-summary__item">最早考核：{{ formatDateTime(stage.earliestAssessAt) }}</div>
                            <div class="stage-summary__item">最晚考核：{{ formatDateTime(stage.latestAssessAt) }}</div>
                            <div class="stage-summary__item">培训超时：{{ resolveFlagText(stage.overtimeFlag) }}</div>
                            <div class="stage-summary__item">考核延迟：{{ resolveFlagText(stage.delayedAssessFlag) }}</div>
                            <div class="stage-summary__item">
                              阶段评级：
                              <DictTag
                                size="small"
                                dict-code="assessment_stage_rating"
                                :value="stage.rating"
                                :fallback-label="getStageRatingFallbackLabel(stage)"
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
                                    <DictTag
                                      dict-code="assessment_paper_status"
                                      :value="record.status"
                                      :fallback-label="getPaperStatusFallbackLabel(record.status)"
                                    />
                                    <DictTag
                                      dict-code="assessment_pass_result"
                                      :value="resolveAssessmentPassResult(record.status, record.passFlag)"
                                      :fallback-label="getAssessmentPassResultLabel(record.status, record.passFlag)"
                                    />
                                  </div>

                                  <div class="record-item__meta">
                                    <span>考核时间：{{ formatDateTime(record.createdAt) }}</span>
                                    <span>批阅时间：{{ formatDateTime(record.reviewedAt) }}</span>
                                    <span>得分：{{ record.score ?? '-' }}</span>
                                    <span>答对：{{ record.questionTotal == null ? '-' : `${record.correctTotal ?? 0} / ${record.questionTotal}` }}</span>
                                  </div>

                                  <div class="record-item__comment">评语：{{ record.finalComment || '-' }}</div>
                                </div>

                                <div class="record-item__actions">
                                  <NButton size="small" quaternary type="primary" @click="openPaperDetail(record)">查看详情</NButton>
                                </div>
                              </div>
                            </div>

                            <div v-else class="record-list__empty">
                              <NEmpty description="当前阶段暂无阶段考核记录" />
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
              <div class="public-tab-pane">
                <div class="detail-section">
                  <PathDailyCalendar :calendar="dailyCalendar" />
                </div>
              </div>
            </NTabPane>
          </NTabs>
        </section>

        <section class="public-review-card public-review-card--form">
          <div class="review-form-header">
            <div>
              <div class="public-review-card__title">评分表单</div>
              <div class="review-template-name">{{ finalTemplate?.name || pathDetail?.finalTemplateName || '-' }}</div>
            </div>
            <div class="review-score">{{ finalReviewTotalScore }} / {{ finalReviewMaxScore }}</div>
          </div>

          <div class="reviewer-field">
            <div class="field-label">评分人</div>
            <NSelect v-model:value="reviewerUserId" :options="reviewerSelectOptions" filterable clearable placeholder="请选择自己的账户" />
          </div>

          <div v-if="groupedItems.length" class="review-dimension-list">
            <div v-for="group in groupedItems" :key="group.key" class="review-dimension">
              <div class="review-dimension__header">
                <strong>{{ group.name }}</strong>
                <NTag size="small" type="info" :bordered="false">{{ group.score }} / {{ group.maxScore }}</NTag>
              </div>
              <div class="review-item-list">
                <div v-for="item in group.items" :key="item.itemId" class="review-item">
                  <div class="review-item__main">
                    <div class="review-item__name">{{ item.itemName || '-' }}</div>
                    <div v-if="item.itemDescription" class="review-item__desc">{{ item.itemDescription }}</div>
                  </div>
                  <div class="review-item__score">
                    <NInputNumber v-model:value="item.score" :min="0" :max="Number(item.maxScore || 0)" :precision="1" clearable placeholder="得分" />
                    <span>/ {{ item.maxScore || 0 }}</span>
                  </div>
                  <NInput v-model:value="item.comment" clearable placeholder="说明（选填）" />
                </div>
              </div>
            </div>
          </div>
          <NEmpty v-else description="当前总体考评模板暂无评分项" />

          <div class="reviewer-field">
            <div class="field-label">总体说明</div>
            <NInput v-model:value="comment" type="textarea" :rows="3" placeholder="请输入本次总体考评说明（选填）" />
          </div>

          <div class="review-actions">
            <NButton type="primary" size="large" :loading="submitting" @click="handleSubmit">提交评分</NButton>
          </div>
        </section>
      </div>

      <div v-else-if="submitted" class="public-review-result">
        <NIcon size="64" color="#18a058"><CheckmarkCircleOutline /></NIcon>
        <h2>评分已提交</h2>
        <p>感谢参与，本次评分已独立保存。</p>
      </div>

      <div v-else class="public-review-result">
        <NEmpty description="总体考评链接不存在或已失效" />
      </div>
    </NSpin>

    <NModal
      :show="showPaperDetailDialog"
      preset="card"
      title="阶段考核详情"
      :style="{ width: '980px', maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(100vh - 32px)' }"
      class="paper-detail-modal"
      @update:show="value => !value && closePaperDetail()"
    >
      <NSpin :show="paperDetailLoading">
        <div v-if="activePaperDetail" class="paper-detail">
          <div class="paper-detail-summary">
            <div class="paper-detail-summary__item">
              <span>培训阶段</span>
              <strong>{{ activePaperDetail.stageName || '-' }}</strong>
            </div>
            <div class="paper-detail-summary__item">
              <span>试卷状态</span>
              <DictTag
                size="small"
                dict-code="assessment_paper_status"
                :value="activePaperDetail.status"
                :fallback-label="getPaperStatusFallbackLabel(activePaperDetail.status)"
              />
            </div>
            <div class="paper-detail-summary__item">
              <span>考核结果</span>
              <DictTag
                size="small"
                dict-code="assessment_pass_result"
                :value="resolveAssessmentPassResult(activePaperDetail.status, activePaperDetail.passFlag)"
                :fallback-label="getPaperPassText(activePaperDetail)"
              />
            </div>
            <div class="paper-detail-summary__item">
              <span>得分</span>
              <strong>{{ activePaperDetail.score ?? '-' }}</strong>
            </div>
            <div class="paper-detail-summary__item">
              <span>答对题数</span>
              <strong>{{ activePaperDetail.questionTotal == null ? '-' : `${activePaperDetail.correctTotal ?? 0} / ${activePaperDetail.questionTotal}` }}</strong>
            </div>
            <div class="paper-detail-summary__item">
              <span>批阅时间</span>
              <strong>{{ formatDateTime(activePaperDetail.reviewedAt) }}</strong>
            </div>
          </div>

          <div class="paper-detail-comment">评语：{{ activePaperDetail.finalComment || '-' }}</div>

          <div v-if="activePaperDetail.items?.length" class="paper-question-list">
            <div v-for="(item, index) in activePaperDetail.items" :key="item.id || item.questionId || index" class="paper-question-item">
              <div class="paper-question-item__head">
                <div class="paper-question-item__title">
                  <span class="paper-question-item__index">#{{ index + 1 }}</span>
                  <span>{{ item.stem || '-' }}</span>
                </div>
                <DictTag
                  size="small"
                  dict-code="assessment_review_result"
                  :value="normalizeAssessmentReviewResult(item.finalResult || item.manualResult)"
                  :fallback-label="getQuestionResultText(item.finalResult || item.manualResult)"
                />
              </div>
              <div v-if="formatQuestionOptions(item.optionSnapshot)" class="paper-question-item__options">
                {{ formatQuestionOptions(item.optionSnapshot) }}
              </div>
              <div class="paper-question-item__meta">
                <span>知识点：{{ item.knowledgePoint || '-' }}</span>
                <span>难度：{{ item.difficulty || '-' }}</span>
                <span>分值：{{ item.score ?? '-' }}</span>
                <span>标准答案：{{ item.answerSnapshot || '-' }}</span>
                <span>考生答案：{{ item.studentAnswer || '-' }}</span>
              </div>
              <div v-if="item.reviewComment || item.analysis" class="paper-question-item__comment">
                <span v-if="item.reviewComment">批阅说明：{{ item.reviewComment }}</span>
                <span v-if="item.analysis">解析：{{ item.analysis }}</span>
              </div>
            </div>
          </div>
          <NEmpty v-else description="暂无题目详情" />
        </div>
      </NSpin>
      <template #action>
        <div class="modal-actions">
          <NButton @click="closePaperDetail">关闭</NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/scrollbar' as scrollbar;

.public-review-page {
  display: flex;
  height: 100vh;
  min-height: 720px;
  flex-direction: column;
  overflow: hidden;
  padding: 16px;
  background: rgb(var(--layout-bg-color));
  color: var(--n-text-color-1);
}

.public-review-header {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 16px;
  padding: 16px 20px;
  border-radius: 8px;
  background: rgb(var(--container-bg-color));
  box-shadow: var(--card-box-shadow);
  transition:
    background-color 0.3s ease,
    box-shadow 0.3s ease;
}

.public-review-eyebrow {
  color: var(--em-primary-color);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.public-review-header h1 {
  margin: 4px 0;
  font-size: 26px;
  line-height: 1.2;
}

.public-review-header p {
  margin: 0;
  color: var(--n-text-color-3);
}

.public-review-spin {
  min-height: 0;
  flex: 1;
}

.public-review-spin :deep(.n-spin-content) {
  height: 100%;
}

.public-review-grid {
  display: grid;
  height: 100%;
  min-height: 0;
  grid-template-columns: minmax(640px, 1.45fr) minmax(420px, 0.9fr);
  gap: 16px;
}

.public-review-card {
  min-height: 0;
  border-radius: 8px;
  background: rgb(var(--container-bg-color));
  box-shadow: var(--card-box-shadow);
  transition:
    background-color 0.3s ease,
    box-shadow 0.3s ease;
}

.public-review-card--detail {
  overflow: hidden;
}

.public-detail-tabs {
  display: flex;
  height: 100%;
  flex-direction: column;
}

.public-detail-tabs :deep(.n-tabs-nav) {
  flex: 0 0 auto;
  padding: 0 18px;
}

.public-detail-tabs :deep(.n-tab-pane) {
  height: 100%;
  padding: 0;
}

.public-detail-tabs :deep(.n-tabs-pane-wrapper) {
  min-height: 0;
  flex: 1;
}

.public-tab-pane {
  height: 100%;
  overflow-y: auto;
  padding: 16px 18px 22px;
  @include scrollbar.scrollbar(7px, rgb(31 35 41 / 18%), rgb(255 255 255 / 18%));
}

.public-review-card--form {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 18px;
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

.detail-section {
  margin-bottom: 0;
}

.detail-section + .detail-section {
  margin-top: 20px;
}

.detail-section--boxed {
  padding: 16px 18px;
  border-radius: 14px;
  background: rgb(var(--container-bg-color));
  box-shadow:
    inset 0 0 0 1px rgb(var(--border-color)),
    0 1px 2px rgb(31 35 41 / 4%);
  transition:
    background-color 0.3s ease,
    box-shadow 0.3s ease;
}

html.dark .detail-section--boxed {
  box-shadow:
    inset 0 0 0 1px rgb(var(--border-color)),
    0 1px 2px rgb(0 0 0 / 18%);
}

.detail-section--boxed .detail-section__title {
  margin-bottom: 14px;
}

.detail-section__title {
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
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

html.dark .detail-banner {
  box-shadow:
    inset 0 0 0 1px rgb(var(--border-color)),
    0 1px 2px rgb(0 0 0 / 18%);
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

.mini-record-list,
.paper-list,
.daily-report-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mini-record,
.paper-item {
  display: grid;
  grid-template-columns: auto 1fr auto auto minmax(120px, 1fr);
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 6px;
  background: rgb(var(--container-bg-color));
  box-shadow: inset 0 0 0 1px rgb(var(--border-color) / 70%);
  font-size: 13px;
}

.mini-record__desc,
.paper-item__comment {
  overflow: hidden;
  color: var(--n-text-color-3);
  text-overflow: ellipsis;
  white-space: nowrap;
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

.stage-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
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
  border: 1px solid rgb(var(--border-color));
  border-radius: 50%;
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

.stage-item__header--readonly {
  cursor: default;
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

.record-list__title,
.muted-text {
  color: var(--n-text-color-3);
  font-size: 12px;
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

.daily-panel {
  min-height: 100%;
}

.daily-panel__header {
  margin-bottom: 12px;
}

.daily-summary {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.daily-summary__item {
  padding: 10px 12px;
  border-radius: 6px;
  background: rgb(var(--layout-bg-color));
  box-shadow: inset 0 0 0 1px rgb(var(--border-color) / 76%);
}

.daily-summary__item span {
  display: block;
  color: var(--n-text-color-3);
  font-size: 12px;
}

.daily-summary__item strong {
  display: block;
  margin-top: 4px;
}

.daily-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  margin-bottom: 12px;
}

.daily-legend__item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--n-text-color-2);
  font-size: 12px;
}

.daily-legend__dot {
  width: 12px;
  height: 12px;
  border: 1px solid;
  border-radius: 4px;
}

.daily-weekdays,
.daily-calendar-row {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8px;
}

.daily-weekdays {
  margin-bottom: 8px;
  color: var(--n-text-color-3);
  font-size: 12px;
  text-align: center;
}

.daily-calendar-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.daily-cell {
  min-height: 112px;
  padding: 9px;
  border: 1px solid rgb(var(--border-color));
  border-radius: 6px;
  background: var(--daily-stage-background, rgb(var(--container-bg-color)));
  color: var(--daily-stage-text, var(--n-text-color-1));
  cursor: default;
}

.daily-cell--clickable {
  cursor: pointer;
}

.daily-cell--clickable:hover {
  border-color: var(--em-primary-color);
}

.daily-cell--muted {
  background: rgb(var(--layout-bg-color));
  color: var(--n-text-color-3);
  opacity: 0.76;
}

.daily-cell--today {
  box-shadow: 0 0 0 1px var(--em-primary-color);
}

.daily-cell--overtime {
  border-color: #d03050;
}

.daily-cell__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 6px;
}

.daily-cell__month {
  margin-right: 4px;
  color: var(--daily-stage-sub-text, var(--n-text-color-3));
  font-size: 12px;
}

.daily-cell__stage {
  overflow: hidden;
  margin-top: 8px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.daily-cell__meta {
  margin-top: 4px;
  color: var(--daily-stage-sub-text, var(--n-text-color-3));
  font-size: 12px;
}

.daily-cell__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}

.review-form-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 16px;
}

.public-review-card__title {
  font-size: 17px;
  font-weight: 700;
}

.review-template-name {
  margin-top: 2px;
  color: var(--n-text-color-3);
  font-size: 13px;
}

.review-score {
  color: var(--em-primary-color);
  font-size: 24px;
  font-weight: 800;
  white-space: nowrap;
}

.reviewer-field {
  margin-bottom: 16px;
}

.field-label {
  margin-bottom: 8px;
  color: var(--n-text-color-2);
  font-weight: 600;
}

.review-dimension-list {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  padding-right: 4px;
  @include scrollbar.scrollbar(7px, rgb(31 35 41 / 18%), rgb(255 255 255 / 18%));
}

.review-dimension {
  padding: 14px;
  border-radius: 8px;
  background: rgb(var(--layout-bg-color));
  box-shadow: inset 0 0 0 1px rgb(var(--border-color) / 82%);
}

.review-dimension__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.review-item-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.review-item {
  display: grid;
  grid-template-columns: minmax(160px, 1fr) 150px minmax(140px, 0.8fr);
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 6px;
  background: rgb(var(--container-bg-color));
  box-shadow: inset 0 0 0 1px rgb(var(--border-color) / 70%);
}

.review-item__main {
  min-width: 0;
}

.review-item__name {
  overflow: hidden;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.review-item__desc {
  overflow: hidden;
  margin-top: 4px;
  color: var(--n-text-color-3);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.review-item__score {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--n-text-color-3);
}

.review-item__score :deep(.n-input-number) {
  width: 100px;
}

.review-actions {
  display: flex;
  justify-content: flex-end;
  margin: 16px -18px -18px;
  padding: 16px 18px;
  background: rgb(var(--container-bg-color) / 96%);
  box-shadow: 0 -10px 30px rgb(15 23 42 / 8%);
}

.public-review-result {
  display: flex;
  height: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: rgb(var(--container-bg-color));
  box-shadow: var(--card-box-shadow);
  text-align: center;
}

.paper-detail {
  display: flex;
  max-height: calc(100vh - 170px);
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
  padding-right: 4px;
  @include scrollbar.scrollbar(7px, rgb(31 35 41 / 18%), rgb(255 255 255 / 18%));
}

.paper-detail-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.paper-detail-summary__item,
.paper-detail-comment,
.paper-question-item {
  padding: 10px 12px;
  border-radius: 8px;
  background: rgb(var(--layout-bg-color));
  box-shadow: inset 0 0 0 1px rgb(var(--border-color) / 76%);
}

.paper-detail-summary__item span {
  display: block;
  margin-bottom: 4px;
  color: var(--n-text-color-3);
  font-size: 12px;
}

.paper-detail-summary__item strong {
  word-break: break-all;
}

.paper-detail-comment {
  color: var(--n-text-color-2);
}

.paper-question-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.paper-question-item__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.paper-question-item__title {
  display: flex;
  min-width: 0;
  gap: 8px;
  font-weight: 700;
  line-height: 1.6;
}

.paper-question-item__index {
  color: var(--em-primary-color);
  white-space: nowrap;
}

.paper-question-item__options,
.paper-question-item__meta,
.paper-question-item__comment {
  margin-top: 8px;
  color: var(--n-text-color-3);
  font-size: 13px;
}

.paper-question-item__meta,
.paper-question-item__comment {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
}

:deep(.paper-detail-modal > .n-card) {
  display: flex;
  max-height: calc(100vh - 32px);
  flex-direction: column;
}

:deep(.paper-detail-modal .n-card__content) {
  overflow: hidden;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
}

@media (width <= 1180px) {
  .public-review-page {
    height: auto;
    min-height: 100vh;
    overflow: auto;
  }

  .public-review-grid,
  .detail-overview-grid {
    grid-template-columns: 1fr;
  }

  .public-review-card--form,
  .public-tab-pane {
    overflow: visible;
  }

  .review-dimension-list {
    overflow: visible;
  }
}
</style>
