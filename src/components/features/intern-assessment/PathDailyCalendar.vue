<script setup lang="ts">
import { computed, ref } from 'vue';
import { NButton, NEmpty, NModal, NTag } from 'naive-ui';
import DictTag from '@/components/common/DictTag.vue';
import type { AssessmentPathDailyCalendarDayVo, AssessmentPathDailyCalendarVo } from '@/types/app';
import { getAssessmentDailyReportStatusLabel } from '@/utils/assessment-dict';

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

const props = defineProps<{
  calendar?: AssessmentPathDailyCalendarVo | null;
}>();

const dailyCalendarWeekLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] as const;
const activeDailyCell = ref<AssessmentPathDailyCalendarDayVo | null>(null);
const showDailyDetailDialog = ref(false);

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
  }
];

const dailyStageColorMap = computed(() => {
  const map = new Map<string, DailyStageColor>();
  Array.from(
    (props.calendar?.days || []).reduce((result, item) => {
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
    (props.calendar?.days || []).reduce(
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
  const dayList = props.calendar?.days || [];
  if (!dayList.length) return [];
  const dayMap = new Map(dayList.map(item => [formatDateDay(item.date), item] as const));
  const startDate = createDateByText(formatDateDay(props.calendar?.startDate));
  const endDate = createDateByText(formatDateDay(props.calendar?.endDate));
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
  const days = props.calendar?.days || [];
  const submittedCount = days.filter(item => item.reportStatus === 'submitted').length;
  const pendingCount = days.filter(item => item.reportStatus === 'pending').length;
  const overtimeCount = days.filter(item => item.overtimeStageFlag).length;
  return [
    { label: '培训区间', value: `${formatDateDay(props.calendar?.startDate)} ~ ${formatDateDay(props.calendar?.endDate)}` },
    { label: '阶段数', value: `${dailyStageLegend.value.length}` },
    { label: '已提交', value: `${submittedCount}` },
    { label: '未提交', value: `${pendingCount}` },
    { label: '超时天数', value: `${overtimeCount}` }
  ];
});

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

function getDailyStatusText(day?: AssessmentPathDailyCalendarDayVo | null) {
  if (!day) return '-';
  return getAssessmentDailyReportStatusLabel(day.reportStatus, day.holidayFlag);
}

function getDailyStatusTagType(status?: string): 'default' | 'success' | 'warning' | 'error' | 'info' {
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

function getStageStatusFallbackLabel(status?: string | null) {
  if (status === 'pending') return '未开始';
  if (status === 'in_progress') return '培训中';
  if (status === 'pending_review') return '待考核';
  if (status === 'passed') return '已通过';
  if (status === 'failed') return '未通过';
  if (status === 'ended') return '已结束';
  if (status === 'skipped') return '已跳过';
  return status || '-';
}
</script>

<template>
  <div class="daily-calendar-panel">
    <div class="daily-calendar-panel__header">
      <div class="daily-calendar-panel__title-group">
        <div class="daily-calendar-panel__eyebrow">培训阶段日报追踪</div>
        <div class="daily-calendar-panel__title">按实际培训区间连续展示</div>
      </div>
      <div class="daily-calendar-panel__summary">
        <div v-for="item in dailyCalendarSummary" :key="item.label" class="daily-calendar-summary-chip">
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
            v-for="cell in row.cells"
            :key="cell.key"
            class="daily-calendar-cell"
            :class="{
              'daily-calendar-cell--today': cell.isToday,
              'daily-calendar-cell--clickable': cell.clickable,
              'daily-calendar-cell--overtime': cell.raw?.overtimeStageFlag,
              'daily-calendar-cell--planned': cell.raw?.stageStartedFlag === false,
              'daily-calendar-cell--muted': cell.muted
            }"
            :style="
              cell && !cell.muted && cell.raw && getDailyStageKey(cell.raw)
                ? {
                    '--daily-stage-background': cell.color?.background,
                    '--daily-stage-border': cell.color?.border,
                    '--daily-stage-text': cell.color?.text,
                    '--daily-stage-sub-text': cell.color?.subText || cell.color?.text,
                    background: cell.color?.background,
                    borderColor: cell.color?.border
                  }
                : undefined
            "
            @click="cell.clickable && openDailyDetail(cell.raw)"
          >
            <div class="daily-calendar-cell__head">
              <div class="daily-calendar-cell__date">
                <span class="daily-calendar-cell__month">{{ cell.monthText }}</span>
                <span class="daily-calendar-cell__day">{{ cell.dayText }}</span>
              </div>
              <NTag v-if="cell.raw" size="small" :bordered="false" :type="getDailyStatusTagType(cell.raw.reportStatus)">
                {{ getDailyStatusText(cell.raw) }}
              </NTag>
            </div>
            <div class="daily-calendar-cell__stage">{{ cell.raw?.stageName || (cell.muted ? '非培训日' : '—') }}</div>
            <div class="daily-calendar-cell__meta">
              {{ cell.raw ? getDailyCellSummary(cell.raw) : '未进入培训区间' }}
            </div>
            <div class="daily-calendar-cell__tags">
              <NTag v-if="cell.raw?.assessDate" size="small" :bordered="false" type="info">
                考核 {{ formatDateDay(cell.raw.assessDate) }}
              </NTag>
              <NTag v-if="cell.raw?.passFlag === true" size="small" :bordered="false" type="success">通过</NTag>
              <NTag v-else-if="cell.raw?.passFlag === false" size="small" :bordered="false" type="error">未通过</NTag>
              <NTag v-if="cell.raw?.overtimeStageFlag" size="small" :bordered="false" type="error">超时</NTag>
              <NTag v-if="cell.raw?.holidayFlag" size="small" :bordered="false">节假日</NTag>
              <NTag v-if="cell.raw?.stageStartedFlag === false" size="small" :bordered="false">未开始</NTag>
              <NTag v-else-if="cell.muted" size="small" :bordered="false">休息/空白</NTag>
            </div>
          </div>
        </div>
      </div>
    </div>

    <NEmpty v-else description="暂无日报日历数据" />

    <NModal
      :show="showDailyDetailDialog"
      preset="card"
      title="日报详情"
      :style="{ width: '760px', maxWidth: 'calc(100vw - 32px)' }"
      @update:show="value => !value && closeDailyDetail()"
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
            <DictTag
              dict-code="assessment_path_stage_status"
              :value="activeDailyCell.stageStatus"
              :fallback-label="getStageStatusFallbackLabel(activeDailyCell.stageStatus)"
            />
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
                  <span>更新时间：{{ formatDateTime(report.updatedAt || report.createdAt) }}</span>
                </div>
              </div>
            </div>
          </div>
          <NEmpty v-else description="当日暂无日报记录" />
        </div>
      </div>

      <template #action>
        <div class="stage-dialog-actions">
          <NButton @click="closeDailyDetail">关闭</NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<style scoped lang="scss">
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
  min-height: 36px;
  align-items: center;
  gap: 8px;
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
  flex-shrink: 0;
  border: 1px solid transparent;
  border-radius: 4px;
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
  height: 34px;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgb(var(--em-primary-color-rgb) / 0.06);
  box-shadow: inset 0 0 0 1px rgb(var(--em-primary-color-rgb) / 0.08);
  color: var(--em-primary-color);
  font-size: 13px;
  font-weight: 600;
}

.daily-calendar-cell {
  min-height: 112px;
  padding: 9px;
  border: 1px solid var(--daily-stage-border, rgb(var(--border-color)));
  border-radius: 10px;
  background: var(--daily-stage-background, rgb(var(--container-bg-color)));
  color: var(--daily-stage-text, var(--n-text-color-1));
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.daily-calendar-cell--muted {
  background: rgb(var(--layout-bg-color));
  color: var(--n-text-color-3);
  opacity: 0.74;
}

html.dark .daily-calendar-cell--muted {
  background: rgb(var(--layout-bg-color) / 82%);
}

.daily-calendar-cell--planned {
  background:
    linear-gradient(135deg, rgb(var(--container-bg-color) / 78%), rgb(var(--layout-bg-color) / 88%)),
    var(--daily-stage-background, rgb(var(--layout-bg-color)));
  color: var(--daily-stage-text, var(--n-text-color-2));
}

.daily-calendar-cell--clickable {
  cursor: pointer;
}

.daily-calendar-cell--clickable:hover {
  border-color: var(--em-primary-color);
  box-shadow: 0 8px 18px rgb(var(--em-primary-color-rgb) / 12%);
  transform: translateY(-1px);
}

.daily-calendar-cell--today {
  box-shadow: inset 0 0 0 1px var(--em-primary-color);
}

.daily-calendar-cell--overtime {
  border-color: #d03050;
}

.daily-calendar-cell__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 6px;
}

.daily-calendar-cell__month {
  margin-right: 4px;
  color: var(--daily-stage-sub-text, var(--n-text-color-3));
  font-size: 12px;
}

.daily-calendar-cell__day {
  font-weight: 700;
}

.daily-calendar-cell__stage {
  overflow: hidden;
  margin-top: 8px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.daily-calendar-cell__meta {
  margin-top: 4px;
  color: var(--daily-stage-sub-text, var(--n-text-color-3));
  font-size: 12px;
}

.daily-calendar-cell__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}

.daily-calendar-cell--muted :deep(.n-tag) {
  background: rgb(var(--container-bg-color) / 74%) !important;
  color: var(--n-text-color-3) !important;
}

.daily-calendar-cell :deep(.n-tag) {
  max-width: 100%;
}

.daily-detail-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

.daily-detail-grid__item,
.record-item {
  padding: 10px 12px;
  border-radius: 8px;
  background: rgb(var(--layout-bg-color));
  box-shadow: inset 0 0 0 1px rgb(var(--border-color) / 72%);
}

.daily-detail-grid__label {
  display: block;
  margin-bottom: 4px;
  color: var(--n-text-color-3);
  font-size: 12px;
}

.record-list__title {
  margin-bottom: 8px;
  color: var(--n-text-color-2);
  font-weight: 700;
}

.record-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.record-item__title,
.record-item__meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.record-item__title {
  font-weight: 700;
}

.record-item__meta,
.record-item__comment {
  margin-top: 6px;
  color: var(--n-text-color-3);
  font-size: 13px;
}

.stage-dialog-actions {
  display: flex;
  justify-content: flex-end;
}

@media (width <= 1080px) {
  .daily-calendar-panel__header {
    flex-direction: column;
  }

  .daily-calendar-panel__summary {
    justify-content: flex-start;
  }

  .daily-calendar-weekdays,
  .daily-calendar-grid {
    min-width: 760px;
  }

  .daily-calendar-list,
  .daily-calendar-weekdays {
    overflow-x: auto;
  }
}
</style>
