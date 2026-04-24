<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { NButton, NEmpty, NInput, NSpin, NTag } from 'naive-ui';
import DictTag from '@/components/common/DictTag.vue';
import InfoPageLayout from '@/components/pages/InfoPageLayout.vue';
import {
  fetchAssessmentPathById,
  fetchAssessmentPathDailyCalendar,
  fetchAssessmentPathList,
  fetchAssessmentPathStageDailyList,
  fetchAssessmentPathStageDailySave,
  fetchAssessmentStageById
} from '@/service/api';
import type {
  AssessmentInternPathStageVo,
  AssessmentInternPathVo,
  AssessmentPathDailyCalendarDayVo,
  AssessmentPathDailyCalendarVo,
  AssessmentStageDailyReportVo,
  AssessmentStageVo
} from '@/types/app';
import { getAssessmentDailyReportStatusLabel } from '@/utils/assessment-dict';

definePageMeta({
  title: '学员工作台'
});

interface CalendarCell {
  key: string;
  dateText: string;
  dayText: string;
  isToday: boolean;
  raw: AssessmentPathDailyCalendarDayVo | null;
  muted: boolean;
  style?: Record<string, string>;
}

const authStore = useAuthStore();
const loading = ref(false);
const stageScopeLoading = ref(false);
const submitting = ref(false);
const activePath = ref<AssessmentInternPathVo | null>(null);
const dailyCalendar = ref<AssessmentPathDailyCalendarVo | null>(null);
const currentStageDetail = ref<AssessmentStageVo | null>(null);
const stageDailyReports = ref<AssessmentStageDailyReportVo[]>([]);

const todayText = formatDateText(new Date());
const workbenchForm = reactive({
  id: '',
  pathId: '',
  pathStageId: '',
  reportDate: todayText,
  content: '',
  problem: '',
  plan: '',
  remark: ''
});

const currentPathStage = computed<AssessmentInternPathStageVo | null>(() => {
  const stages = activePath.value?.stages || [];
  if (!stages.length) {
    return null;
  }

  const currentStageId = activePath.value?.currentStageId || '';
  return (
    stages.find(item => item.id && item.id === currentStageId) ||
    stages.find(item => item.stageId && item.stageId === currentStageId) ||
    stages.find(item => ['in_progress', 'pending_review', 'failed'].includes(item.status || '')) ||
    stages.find(item => item.status === 'pending') ||
    stages[0] ||
    null
  );
});

const currentStageMaterials = computed(() => currentStageDetail.value?.materials || []);
const calendarDays = computed(() => dailyCalendar.value?.days || activePath.value?.dailyCalendar?.days || []);
const currentMonthLabel = computed(() => formatMonthLabel(resolveCalendarDisplayDate(calendarDays.value)));

const todayReport = computed(() =>
  stageDailyReports.value.find(item => formatDateText(item.reportDate) === todayText) || null
);

const monthCalendarCells = computed<(CalendarCell | null)[]>(
  () => buildMonthCalendar(calendarDays.value, resolveCalendarDisplayDate(calendarDays.value))
);

const monthSummary = computed(() => {
  const submitted = monthCalendarCells.value.filter(cell => Boolean(cell?.raw?.submittedFlag)).length;
  const pending = monthCalendarCells.value.filter(cell => Boolean(cell?.raw?.expectedReportFlag) && !cell?.raw?.submittedFlag).length;
  const overtime = monthCalendarCells.value.filter(cell => Boolean(cell?.raw?.overtimeStageFlag)).length;
  return [
    { label: '已提交', value: submitted },
    { label: '待提交', value: pending },
    { label: '超时', value: overtime }
  ];
});

const pageSummary = computed(() => [
  { label: '培训计划', value: activePath.value?.templateName || '-' },
  { label: '当前阶段', value: currentPathStage.value?.stageName || '暂无' },
  { label: '今日日报', value: todayReport.value ? '已提交' : '未提交' },
  { label: '学习资料', value: String(currentStageMaterials.value.length) }
]);

const currentStageStatus = computed(() => currentPathStage.value?.status || '');
const currentTimingStatus = computed(() => currentPathStage.value?.timingStatus || '');
const canSubmitToday = computed(() => Boolean(currentPathStage.value?.id && ['in_progress', 'pending_review', 'failed'].includes(currentStageStatus.value)));

watch(
  () => [currentPathStage.value?.id, todayReport.value?.id],
  () => syncReportForm(),
  { immediate: true }
);

watch(
  () => [activePath.value?.id || '', currentPathStage.value?.id || '', currentPathStage.value?.stageId || ''],
  async ([pathId, pathStageId, stageBaseId]) => {
    const stageId = stageBaseId || '';
    if (!pathId || !stageId) {
      currentStageDetail.value = null;
      stageDailyReports.value = [];
      return;
    }

    await loadStageScope(stageId, pathStageId || '');
  },
  { immediate: true }
);

watch(
  () => activePath.value?.id || '',
  async pathId => {
    if (!pathId) {
      dailyCalendar.value = null;
      return;
    }

    await loadDailyCalendar(pathId);
  },
  { immediate: true }
);

onMounted(() => {
  loadWorkbench();
});

async function loadWorkbench() {
  loading.value = true;
  try {
    await authStore.loadUserInfo();
    const userId = authStore.userInfo?.userId;
    if (!userId) {
      resetWorkbenchState();
      return;
    }

    const { data, error } = await fetchAssessmentPathList({
      pageNum: 1,
      pageSize: 20,
      userId,
      sortField: 'updatedAt',
      sortOrder: 'descend'
    });

    if (error) {
      resetWorkbenchState();
      return;
    }

    const records = data?.records || [];
    const selected =
      records.find(item => ['in_progress', 'pending_review'].includes(item.status || '')) ||
      records.find(item => Boolean(item.currentStageId) || Boolean(item.stages?.some(stage => ['in_progress', 'pending_review', 'failed'].includes(stage.status || '')))) ||
      records[0] ||
      null;

    if (!selected?.id) {
      resetWorkbenchState();
      return;
    }

    const detail = await fetchAssessmentPathById(selected.id);
    if (!detail.error && detail.data) {
      activePath.value = detail.data;
      return;
    }

    activePath.value = selected;
  } finally {
    loading.value = false;
  }
}

async function loadStageScope(stageId: string, pathStageId: string) {
  stageScopeLoading.value = true;
  try {
    const stageResult = await fetchAssessmentStageById(stageId);

    currentStageDetail.value = stageResult.error ? null : stageResult.data || null;

    if (pathStageId) {
      const dailyResult = await fetchAssessmentPathStageDailyList(pathStageId);
      stageDailyReports.value = dailyResult.error ? [] : dailyResult.data || [];
    } else {
      stageDailyReports.value = [];
    }
  } finally {
    stageScopeLoading.value = false;
  }
}

async function loadDailyCalendar(pathId: string) {
  const { data, error } = await fetchAssessmentPathDailyCalendar(pathId);
  dailyCalendar.value = error ? null : data || null;
}

function resetWorkbenchState() {
  activePath.value = null;
  dailyCalendar.value = null;
  currentStageDetail.value = null;
  stageDailyReports.value = [];
  syncReportForm();
}

function syncReportForm() {
  const report = todayReport.value;
  workbenchForm.id = report?.id || '';
  workbenchForm.pathId = activePath.value?.id || '';
  workbenchForm.pathStageId = currentPathStage.value?.id || '';
  workbenchForm.reportDate = todayText;
  workbenchForm.content = report?.content || '';
  workbenchForm.problem = report?.problem || '';
  workbenchForm.plan = report?.plan || '';
  workbenchForm.remark = report?.remark || '';
}

async function handleRefresh() {
  await loadWorkbench();
}

async function handleSubmitReport() {
  if (!canSubmitToday.value || !workbenchForm.pathId || !workbenchForm.pathStageId) {
    return;
  }

  if (!String(workbenchForm.content || '').trim()) {
    window.$message?.warning('请填写日报内容');
    return;
  }

  submitting.value = true;
  try {
    const { error } = await fetchAssessmentPathStageDailySave({
      id: workbenchForm.id || undefined,
      pathId: workbenchForm.pathId,
      pathStageId: workbenchForm.pathStageId,
      reportDate: workbenchForm.reportDate,
      content: workbenchForm.content.trim(),
      problem: workbenchForm.problem.trim(),
      plan: workbenchForm.plan.trim(),
      remark: workbenchForm.remark.trim()
    });

    if (error) {
      return;
    }

    window.$message?.success('日报已保存');
    await loadWorkbench();
  } finally {
    submitting.value = false;
  }
}

function formatDateText(value?: string | Date | null) {
  if (!value) {
    return '';
  }

  const date = value instanceof Date ? value : new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatMonthLabel(date: Date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

function buildMonthCalendar(days: AssessmentPathDailyCalendarDayVo[], baseDate: Date) {
  const monthStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const monthEnd = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
  const offset = (monthStart.getDay() + 6) % 7;
  const cells: Array<CalendarCell | null> = Array.from({ length: offset }, () => null);
  const dayMap = new Map(days.map(item => [formatDateText(item.date), item] as const));

  for (let cursor = new Date(monthStart); cursor.getTime() <= monthEnd.getTime(); cursor.setDate(cursor.getDate() + 1)) {
    const dateText = formatDateText(cursor);
    const raw = dayMap.get(dateText) || null;
    const muted = !raw;
    cells.push({
      key: dateText,
      dateText,
      dayText: String(cursor.getDate()),
      isToday: dateText === todayText,
      raw,
      muted,
      style: buildCellStyle(raw, muted)
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function resolveCalendarDisplayDate(days: AssessmentPathDailyCalendarDayVo[]) {
  const todayDay = days.find(item => formatDateText(item.date) === todayText)?.date;
  const firstDay = days.find(item => Boolean(item.date))?.date;
  const value = todayDay || firstDay;
  if (!value) {
    return new Date();
  }

  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function buildCellStyle(day: AssessmentPathDailyCalendarDayVo | null, muted: boolean) {
  if (!day || muted) {
    return undefined;
  }

  const parsed = parseColor(day.stageColor);
  if (!parsed) {
    return {
      background: 'rgb(var(--em-primary-color-rgb) / 0.08)',
      borderColor: 'rgb(var(--em-primary-color-rgb) / 0.18)',
      color: 'var(--em-primary-color)'
    };
  }

  return {
    background: toRgba(parsed, 0.12),
    borderColor: toRgba(parsed, 0.26),
    color: getTextColor(parsed)
  };
}

function parseColor(color?: string | null) {
  if (!color) {
    return null;
  }

  const value = color.trim();
  if (!value) {
    return null;
  }

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

function getTextColor(color: NonNullable<ReturnType<typeof parseColor>>) {
  const luminance = (color.red * 299 + color.green * 587 + color.blue * 114) / 1000;
  return luminance < 150 ? '#ffffff' : `rgb(${color.red}, ${color.green}, ${color.blue})`;
}

function openMaterial(url?: string | null) {
  if (!url) {
    return;
  }

  window.open(url, '_blank', 'noopener,noreferrer');
}

function getDailyStatus(day?: AssessmentPathDailyCalendarDayVo | null) {
  if (!day) {
    return '空白';
  }

  return getAssessmentDailyReportStatusLabel(day.reportStatus, day.holidayFlag);
}

function getDailyTagType(day?: AssessmentPathDailyCalendarDayVo | null) {
  if (!day) {
    return 'default';
  }

  if (day.submittedFlag) return 'success';
  if (day.expectedReportFlag) return 'warning';
  if (day.holidayFlag) return 'default';
  return 'info';
}

function formatStudyDaysRange(minStudyDays?: number | null, maxStudyDays?: number | null) {
  if (minStudyDays == null && maxStudyDays == null) {
    return '未配置';
  }
  if (minStudyDays != null && maxStudyDays != null) {
    return `${minStudyDays}-${maxStudyDays}天`;
  }
  if (minStudyDays != null) {
    return `不少于 ${minStudyDays} 天`;
  }
  return `不超过 ${maxStudyDays} 天`;
}
</script>

<template>
  <InfoPageLayout>
    <template #title>学员工作台</template>
    <template #actions>
      <NButton size="small" @click="handleRefresh">刷新</NButton>
    </template>

    <template #contentBox>
      <NSpin :show="loading">
        <div class="workbench-page">
          <section class="workbench-hero">
            <div class="workbench-hero__backdrop"></div>
            <div class="workbench-hero__main">
              <div class="workbench-hero__eyebrow">阶段考评工作台</div>
              <div class="workbench-hero__title">
                {{ authStore.userInfo?.name || authStore.userInfo?.username || '学员' }}
              </div>
              <div class="workbench-hero__desc">
                {{ activePath?.templateName || '暂无培训计划' }}
              </div>
              <div class="workbench-hero__meta">
                <NTag :bordered="false" type="primary">{{ activePath?.trainingStartDate || '-' }} ~ {{ activePath?.trainingEndDate || '-' }}</NTag>
                <DictTag dict-code="assessment_path_status" :value="activePath?.status" :fallback-label="activePath?.statusLabel || activePath?.status || '-'" />
                <DictTag dict-code="assessment_path_stage_status" :value="currentStageStatus" :fallback-label="currentPathStage?.status || '-'" />
                <DictTag dict-code="assessment_stage_timing_status" :value="currentTimingStatus" :fallback-label="currentPathStage?.timingStatusLabel || currentTimingStatus || '-'" />
              </div>
            </div>
            <div class="workbench-hero__stats">
              <div v-for="item in pageSummary" :key="item.label" class="hero-stat">
                <span class="hero-stat__label">{{ item.label }}</span>
                <strong class="hero-stat__value">{{ item.value }}</strong>
              </div>
            </div>
          </section>

          <div class="workbench-grid">
            <div class="workbench-column workbench-column--main">
              <section class="panel panel--stage">
                <div class="panel__header">
                  <div>
                    <div class="panel__eyebrow">当前阶段</div>
                    <div class="panel__title">{{ currentPathStage?.stageName || '暂无阶段' }}</div>
                  </div>
                  <div class="panel__header-actions">
                    <NTag v-if="currentPathStage?.overtimeFlag" :bordered="false" type="error">已超时</NTag>
                    <NTag v-else :bordered="false" type="success">正常</NTag>
                  </div>
                </div>

                <div v-if="currentPathStage" class="stage-summary">
                  <div class="stage-summary__item">
                    <span class="stage-summary__label">阶段状态</span>
                    <DictTag dict-code="assessment_path_stage_status" :value="currentStageStatus" :fallback-label="currentPathStage.status || '-'" />
                  </div>
                  <div class="stage-summary__item">
                    <span class="stage-summary__label">时间状态</span>
                    <DictTag dict-code="assessment_stage_timing_status" :value="currentTimingStatus" :fallback-label="currentPathStage.timingStatusLabel || currentTimingStatus || '-'" />
                  </div>
                  <div class="stage-summary__item">
                    <span class="stage-summary__label">学习区间</span>
                    <span>{{ formatStudyDaysRange(currentStageDetail?.minStudyDays, currentStageDetail?.maxStudyDays) }}</span>
                  </div>
                  <div class="stage-summary__item">
                    <span class="stage-summary__label">阶段说明</span>
                    <span>{{ currentStageDetail?.description || currentPathStage.timingDescription || '-' }}</span>
                  </div>
                </div>

                <NEmpty v-else description="暂无当前阶段" />
              </section>

              <section class="panel panel--calendar">
                <div class="panel__header">
                  <div>
                    <div class="panel__eyebrow">小型日历</div>
                    <div class="panel__title">{{ currentMonthLabel }}</div>
                  </div>
                  <div class="panel__header-actions">
                    <div v-for="item in monthSummary" :key="item.label" class="calendar-chip">
                      <span class="calendar-chip__label">{{ item.label }}</span>
                      <strong class="calendar-chip__value">{{ item.value }}</strong>
                    </div>
                  </div>
                </div>

                <div v-if="calendarDays.length" class="mini-calendar">
                  <div class="mini-calendar__weekdays">
                    <span v-for="item in ['一', '二', '三', '四', '五', '六', '日']" :key="item">{{ item }}</span>
                  </div>
                  <div class="mini-calendar__grid">
                    <div
                      v-for="(cell, index) in monthCalendarCells"
                      :key="cell?.key || `empty-${index}`"
                      class="mini-calendar__cell"
                      :class="{
                        'mini-calendar__cell--today': Boolean(cell?.isToday),
                        'mini-calendar__cell--muted': !cell || cell.muted,
                        'mini-calendar__cell--submitted': Boolean(cell?.raw?.submittedFlag),
                        'mini-calendar__cell--overtime': Boolean(cell?.raw?.overtimeStageFlag),
                        'mini-calendar__cell--empty': !cell
                      }"
                      :style="cell?.style"
                    >
                      <template v-if="cell">
                        <div class="mini-calendar__top">
                          <span class="mini-calendar__date">{{ cell.dayText }}</span>
                          <NTag v-if="cell.raw" size="small" :bordered="false" :type="getDailyTagType(cell.raw)">
                            {{ getDailyStatus(cell.raw) }}
                          </NTag>
                        </div>
                        <div class="mini-calendar__stage">{{ cell.raw?.stageName || '未排期' }}</div>
                        <div class="mini-calendar__meta">
                          <span>{{ cell.raw?.expectedReportFlag ? '应提交日报' : '无需提交' }}</span>
                          <span v-if="cell.raw?.overtimeStageFlag">已超时</span>
                        </div>
                      </template>
                    </div>
                  </div>
                </div>

                <NEmpty v-else description="暂无日历数据" />
              </section>
            </div>

            <div class="workbench-column workbench-column--side">
              <section class="panel panel--form">
                <div class="panel__header">
                  <div>
                    <div class="panel__eyebrow">今日提交</div>
                    <div class="panel__title">{{ todayText }}</div>
                  </div>
                  <NTag :bordered="false" :type="todayReport ? 'success' : 'warning'">
                    {{ todayReport ? '已提交' : '未提交' }}
                  </NTag>
                </div>

                <div v-if="currentPathStage" class="report-form">
                  <div class="report-form__field">
                    <div class="report-form__label">内容</div>
                    <NInput v-model:value="workbenchForm.content" type="textarea" placeholder="填写今日学习和完成情况" :autosize="{ minRows: 4, maxRows: 8 }" />
                  </div>
                  <div class="report-form__field">
                    <div class="report-form__label">问题</div>
                    <NInput v-model:value="workbenchForm.problem" type="textarea" placeholder="填写遇到的问题" :autosize="{ minRows: 3, maxRows: 6 }" />
                  </div>
                  <div class="report-form__field">
                    <div class="report-form__label">计划</div>
                    <NInput v-model:value="workbenchForm.plan" type="textarea" placeholder="填写明日计划" :autosize="{ minRows: 3, maxRows: 6 }" />
                  </div>
                  <div class="report-form__field">
                    <div class="report-form__label">备注</div>
                    <NInput v-model:value="workbenchForm.remark" type="textarea" placeholder="填写补充说明" :autosize="{ minRows: 2, maxRows: 4 }" />
                  </div>
                  <div class="report-form__actions">
                    <NButton type="primary" :loading="submitting" :disabled="!canSubmitToday" @click="handleSubmitReport">
                      {{ todayReport ? '更新日报' : '提交日报' }}
                    </NButton>
                  </div>
                </div>

                <NEmpty v-else description="当前阶段未开始" />
              </section>

              <section class="panel panel--materials">
                <div class="panel__header">
                  <div>
                    <div class="panel__eyebrow">学习资料</div>
                    <div class="panel__title">本阶段资料</div>
                  </div>
                </div>

                <div v-if="currentStageMaterials.length" class="material-list">
                  <div v-for="item in currentStageMaterials" :key="item.id || item.title" class="material-item">
                    <div class="material-item__main">
                      <div class="material-item__title">{{ item.title || '未命名资料' }}</div>
                      <div class="material-item__meta">
                        <span v-if="item.materialType">{{ item.materialType }}</span>
                        <span v-if="item.remark">{{ item.remark }}</span>
                      </div>
                    </div>
                    <NButton v-if="item.materialUrl" size="small" secondary @click="openMaterial(item.materialUrl)">查看</NButton>
                  </div>
                </div>

                <NEmpty v-else description="暂无学习资料" />
              </section>

              <section class="panel panel--history">
                <div class="panel__header">
                  <div>
                    <div class="panel__eyebrow">历史日报</div>
                    <div class="panel__title">当前阶段</div>
                  </div>
                  <NTag :bordered="false" type="info">{{ stageDailyReports.length }} 条</NTag>
                </div>

                <NSpin :show="stageScopeLoading">
                  <div v-if="stageDailyReports.length" class="history-list">
                    <div v-for="item in stageDailyReports" :key="item.id || item.reportDate" class="history-item">
                      <div class="history-item__head">
                        <div class="history-item__date">
                          <span>{{ item.reportDate || '-' }}</span>
                          <NTag size="small" :bordered="false" :type="formatDateText(item.reportDate) === todayText ? 'primary' : 'default'">
                            {{ formatDateText(item.reportDate) === todayText ? '今日' : '历史' }}
                          </NTag>
                        </div>
                        <span class="history-item__time">{{ item.updatedAt || item.createdAt || '-' }}</span>
                      </div>
                      <div class="history-item__body">
                        <div class="history-item__line">
                          <span class="history-item__label">内容</span>
                          <span class="history-item__text">{{ item.content || '-' }}</span>
                        </div>
                        <div class="history-item__line">
                          <span class="history-item__label">问题</span>
                          <span class="history-item__text">{{ item.problem || '-' }}</span>
                        </div>
                        <div class="history-item__line">
                          <span class="history-item__label">计划</span>
                          <span class="history-item__text">{{ item.plan || '-' }}</span>
                        </div>
                        <div class="history-item__line">
                          <span class="history-item__label">备注</span>
                          <span class="history-item__text">{{ item.remark || '-' }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <NEmpty v-else description="暂无日报记录" />
                </NSpin>
              </section>
            </div>
          </div>
        </div>
      </NSpin>
    </template>
  </InfoPageLayout>
</template>

<style scoped lang="scss">
.workbench-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-width: 0;
}

.workbench-hero,
.panel {
  position: relative;
  overflow: hidden;
  border: 1px solid rgb(var(--border-color) / 88%);
  border-radius: 14px;
  background: rgb(var(--container-bg-color));
  box-shadow:
    inset 0 0 0 1px rgb(var(--border-color) / 84%),
    0 1px 2px rgb(31 35 41 / 4%);
}

.workbench-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(320px, 0.9fr);
  gap: 16px;
  padding: 18px;
}

.workbench-hero__backdrop {
  display: none;
}

.workbench-hero__main,
.workbench-hero__stats {
  position: relative;
  z-index: 1;
}

.workbench-hero__main {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.workbench-hero__eyebrow {
  color: var(--em-primary-color);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.workbench-hero__title {
  color: var(--n-text-color-1);
  font-size: 20px;
  font-weight: 600;
  line-height: 1.15;
}

.workbench-hero__desc {
  color: var(--n-text-color-2);
  font-size: 13px;
  line-height: 1.6;
}

.workbench-hero__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.workbench-hero__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.hero-stat {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 72px;
  padding: 14px;
  border-radius: 12px;
  background: rgb(var(--layout-bg-color));
  box-shadow: inset 0 0 0 1px rgb(var(--border-color) / 84%);
}

.hero-stat__label {
  color: var(--n-text-color-3);
  font-size: 12px;
}

.hero-stat__value {
  margin-top: 8px;
  color: var(--n-text-color-1);
  font-size: 16px;
  font-weight: 600;
  line-height: 1.2;
}

.workbench-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(360px, 0.8fr);
  gap: 16px;
  min-width: 0;
}

.workbench-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

.panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.panel__eyebrow {
  color: var(--n-text-color-3);
  font-size: 12px;
  letter-spacing: 0.08em;
}

.panel__title {
  margin-top: 4px;
  color: var(--n-text-color-1);
  font-size: 16px;
  font-weight: 600;
}

.panel__header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.stage-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.stage-summary__item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 88px;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgb(var(--layout-bg-color));
  box-shadow: inset 0 0 0 1px rgb(var(--border-color) / 82%);
  color: var(--n-text-color-2);
}

.stage-summary__label {
  color: var(--n-text-color-3);
  font-size: 12px;
}

.calendar-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgb(var(--em-primary-color-rgb) / 0.08);
  box-shadow: inset 0 0 0 1px rgb(var(--em-primary-color-rgb) / 0.12);
}

.calendar-chip__label {
  color: var(--n-text-color-3);
  font-size: 12px;
}

.calendar-chip__value {
  color: var(--em-primary-color);
  font-size: 13px;
}

.mini-calendar {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mini-calendar__weekdays,
.mini-calendar__grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 10px;
}

.mini-calendar__weekdays {
  color: var(--n-text-color-3);
  font-size: 12px;
  font-weight: 600;
}

.mini-calendar__weekdays span {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 30px;
  border-radius: 8px;
  background: rgb(var(--layout-bg-color));
  box-shadow: inset 0 0 0 1px rgb(var(--border-color) / 78%);
}

.mini-calendar__cell {
  min-height: 108px;
  padding: 10px;
  border: 1px solid rgb(var(--border-color) / 84%);
  border-radius: 12px;
  background: rgb(var(--layout-bg-color));
  box-shadow: inset 0 0 0 1px rgb(var(--border-color) / 60%);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.mini-calendar__cell--today {
  box-shadow: inset 0 0 0 1px var(--em-primary-color);
}

.mini-calendar__cell--overtime {
  border-color: rgb(208 48 80 / 58%);
}

.mini-calendar__cell--submitted {
  border-color: rgb(82 196 26 / 42%);
}

.mini-calendar__cell--muted {
  opacity: 0.6;
}

.mini-calendar__cell--empty {
  border-color: transparent;
  background: transparent;
  box-shadow: none;
}

.mini-calendar__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.mini-calendar__date {
  color: var(--n-text-color-1);
  font-size: 18px;
  font-weight: 800;
}

.mini-calendar__stage {
  overflow: hidden;
  margin-top: 10px;
  color: inherit;
  font-size: 13px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mini-calendar__meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
  color: var(--n-text-color-3);
  font-size: 12px;
  line-height: 1.4;
}

.report-form,
.material-list,
.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.report-form__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.report-form__label {
  color: var(--n-text-color-2);
  font-size: 13px;
  font-weight: 600;
}

.report-form__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}

.material-item,
.history-item {
  padding: 14px;
  border-radius: 12px;
  background: rgb(var(--layout-bg-color));
  box-shadow: inset 0 0 0 1px rgb(var(--border-color) / 82%);
}

.material-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.material-item__main {
  min-width: 0;
}

.material-item__title {
  color: var(--n-text-color-1);
  font-size: 14px;
  font-weight: 700;
}

.material-item__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin-top: 6px;
  color: var(--n-text-color-3);
  font-size: 12px;
}

.history-item {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.history-item__date {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--n-text-color-1);
  font-size: 14px;
  font-weight: 700;
}

.history-item__time {
  color: var(--n-text-color-3);
  font-size: 12px;
}

.history-item__body {
  display: grid;
  gap: 10px;
}

.history-item__line {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
}

.history-item__label {
  color: var(--n-text-color-3);
  font-size: 12px;
}

.history-item__text {
  color: var(--n-text-color-2);
  font-size: 13px;
  line-height: 1.6;
  word-break: break-word;
}

@media (width <= 1180px) {
  .workbench-hero,
  .workbench-grid {
    grid-template-columns: 1fr;
  }
}

@media (width <= 960px) {
  .stage-summary,
  .workbench-hero__stats {
    grid-template-columns: 1fr;
  }

  .mini-calendar__weekdays,
  .mini-calendar__grid {
    gap: 8px;
  }

  .mini-calendar__cell {
    min-height: 96px;
  }

  .material-item,
  .history-item__head {
    align-items: flex-start;
    flex-direction: column;
  }

  .history-item__line {
    grid-template-columns: 1fr;
  }
}
</style>
