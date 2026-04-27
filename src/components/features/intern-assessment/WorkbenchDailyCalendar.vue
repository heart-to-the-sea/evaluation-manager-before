<script setup lang="ts">
import { computed, ref } from 'vue';
import { useDict } from '@/composables/use-dict';
import type { AssessmentPathDailyCalendarVo, AssessmentPathDailyCalendarDayVo } from '@/types/app';

interface Props {
  calendar: AssessmentPathDailyCalendarVo;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  dayClick: [day: AssessmentPathDailyCalendarDayVo];
}>();

const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const currentDate = new Date();
const currentYear = ref(currentDate.getFullYear());
const currentMonth = ref(currentDate.getMonth());
const dailyReportStatusDictCode = 'assessment_daily_report_status';
const { getCustomColor: getDailyReportStatusColor, getLabel: getDailyReportStatusLabel } = useDict(() => dailyReportStatusDictCode);

const todayText = formatDateText(currentDate);

const monthLabel = computed(() => `${currentYear.value}年${currentMonth.value + 1}月`);

type CalendarCell = {
  key: string;
  dateText: string;
  day: number;
  raw: AssessmentPathDailyCalendarDayVo | null;
  inCurrentMonth: boolean;
  inTraining: boolean;
  muted: boolean;
  clickable: boolean;
};

type WorkbenchReportStatus = 'submitted' | 'pending' | 'holiday' | 'none';
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
  }
];

const dailyStageColorMap = computed(() => {
  const map = new Map<string, DailyStageColor>();
  Array.from(
    (props.calendar.days || []).reduce((result, item) => {
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

const calendarDays = computed(() => {
  const year = currentYear.value;
  const month = currentMonth.value;
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalDays = lastDay.getDate();
  const startText = formatDateText(props.calendar.startDate);
  const endText = formatDateText(props.calendar.endDate);

  const days: CalendarCell[] = [];

  for (let i = 0; i < startOffset; i++) {
    days.push({
      key: `empty-prefix-${i}`,
      dateText: '',
      day: 0,
      raw: null,
      inCurrentMonth: false,
      inTraining: false,
      muted: true,
      clickable: false
    });
  }

  const dayMap = new Map<string, AssessmentPathDailyCalendarDayVo>();
  (props.calendar.days || []).forEach(d => {
    const key = formatDateText(d.date);
    if (key) dayMap.set(key, d);
  });

  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(year, month, d);
    const dateText = formatDateText(date);
    const raw = dayMap.get(dateText) || null;
    const inTraining = Boolean(startText && endText && dateText >= startText && dateText <= endText);
    const hasStageSchedule = hasCalendarStage(raw);
    const muted = !inTraining || Boolean(raw?.holidayFlag) || !hasStageSchedule;
    const clickable = Boolean(raw && (raw.reports?.length || raw.pathStageId || raw.stageId || raw.holidayFlag));
    days.push({
      key: dateText,
      dateText,
      day: d,
      raw,
      inCurrentMonth: true,
      inTraining,
      muted,
      clickable
    });
  }

  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let i = 0; i < remaining; i++) {
      days.push({
        key: `empty-suffix-${i}`,
        dateText: '',
        day: 0,
        raw: null,
        inCurrentMonth: false,
        inTraining: false,
        muted: true,
        clickable: false
      });
    }
  }

  return days;
});

const monthSummary = computed(() => {
  const prefix = `${currentYear.value}-${`${currentMonth.value + 1}`.padStart(2, '0')}-`;
  const days = (props.calendar.days || []).filter(item => formatDateText(item.date).startsWith(prefix));
  const submitted = days.filter(d => resolveReportStatus(d) === 'submitted').length;
  const pending = days.filter(d => resolveReportStatus(d) === 'pending').length;
  return { submitted, pending };
});

function prevMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
}

function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
}

function goToToday() {
  currentYear.value = currentDate.getFullYear();
  currentMonth.value = currentDate.getMonth();
}

function handleDayClick(day: AssessmentPathDailyCalendarDayVo | null) {
  if (!day || !day.date) return;
  emit('dayClick', day);
}

function getDailyStageKey(day?: Pick<AssessmentPathDailyCalendarDayVo, 'pathStageId' | 'stageId'> | null) {
  return day?.pathStageId || day?.stageId || '';
}

function hasCalendarStage(day?: AssessmentPathDailyCalendarDayVo | null) {
  if (!day) return false;
  return Boolean(day.pathStageId || day.stageId || day.stageName || day.stageColor || day.stageStatus || day.assessDate);
}

// 颜色解析函数 - 参考 PathDailyCalendar
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

function getDayBgStyle(day: AssessmentPathDailyCalendarDayVo | null) {
  if (!day) {
    return {
      '--daily-stage-background': 'rgb(var(--container-bg-color))',
      '--daily-stage-border': 'rgb(var(--border-color))',
      '--daily-stage-text': 'var(--n-text-color-1)',
      '--daily-stage-sub-text': 'var(--n-text-color-3)'
    };
  }

  const hasStageSchedule = hasCalendarStage(day);
  if (day.holidayFlag || !hasStageSchedule) {
    return {
      '--daily-stage-background': 'rgb(var(--layout-bg-color))',
      '--daily-stage-border': 'rgb(var(--border-color))',
      '--daily-stage-text': 'var(--n-text-color-3)',
      '--daily-stage-sub-text': 'var(--n-text-color-3)'
    };
  }

  const stageColor = dailyStageColorMap.value.get(getDailyStageKey(day));
  if (stageColor) {
    const planned = day.stageStartedFlag === false;
    return {
      '--daily-stage-background': planned ? stageColor.background.replace(/0\.14|0\.11|0\.08|0\.06/g, '0.08') : stageColor.background,
      '--daily-stage-border': planned ? stageColor.border.replace(/0\.28|0\.22|0\.18|0\.16/g, '0.18') : stageColor.border,
      '--daily-stage-text': stageColor.text,
      '--daily-stage-sub-text': stageColor.subText
    };
  }

  // 默认主色
  return {
    '--daily-stage-background': 'rgb(var(--em-primary-color-rgb) / 0.14)',
    '--daily-stage-border': 'rgb(var(--em-primary-color-rgb) / 0.28)',
    '--daily-stage-text': 'var(--em-primary-color)',
    '--daily-stage-sub-text': 'rgb(var(--em-primary-color-rgb) / 0.78)'
  };
}

function resolveReportStatus(day?: AssessmentPathDailyCalendarDayVo | null): WorkbenchReportStatus {
  if (!day) return 'none';
  if (day.holidayFlag) return 'holiday';

  const hasStageSchedule = hasCalendarStage(day);
  if (!hasStageSchedule || day.stageStartedFlag === false) return 'none';

  if (day.submittedFlag || day.reports?.length || day.reportStatus === 'submitted') return 'submitted';
  if (day.expectedReportFlag || day.reportStatus === 'pending') return 'pending';

  return 'none';
}

function getVisibleReportStatus(day?: AssessmentPathDailyCalendarDayVo | null) {
  const status = resolveReportStatus(day);
  if (status === 'submitted' || status === 'pending') return status;
  return '';
}

function getStatusDotStyle(day?: AssessmentPathDailyCalendarDayVo | null) {
  const status = getVisibleReportStatus(day);
  if (!status) {
    return {
      background: 'transparent',
      boxShadow: 'none'
    };
  }

  const color = getDailyReportStatusColor(status) || (status === 'submitted' ? '#18a058' : '#d03050');
  return {
    background: color,
    boxShadow: `0 0 0 2px ${toAlphaColor(color, 0.18)}`
  };
}

function getStatusDotTitle(day?: AssessmentPathDailyCalendarDayVo | null) {
  const status = getVisibleReportStatus(day);
  if (!status) return '';
  return getDailyReportStatusLabel(status) || (status === 'submitted' ? '已提交' : '未提交');
}

function toAlphaColor(color: string, alpha: number) {
  const parsed = parseColor(color);
  if (!parsed) return `rgb(var(--em-primary-color-rgb) / ${alpha})`;
  return `rgba(${parsed.red}, ${parsed.green}, ${parsed.blue}, ${alpha})`;
}

function formatDateText(value?: string | Date | null) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}
</script>

<template>
  <div class="workbench-calendar">
    <div class="calendar-header">
      <div class="calendar-nav">
        <button class="nav-btn" @click="prevMonth">&lt;</button>
        <span class="calendar-title">{{ monthLabel }}</span>
        <button class="nav-btn" @click="nextMonth">&gt;</button>
      </div>
      <button class="today-btn" @click="goToToday">今天</button>
    </div>

    <div class="calendar-weekdays">
      <div v-for="item in weekdays" :key="item" class="calendar-weekday">{{ item }}</div>
    </div>

    <div class="calendar-grid">
      <div
        v-for="(cell, index) in calendarDays"
        :key="cell.key || index"
        class="calendar-cell"
        :class="{
          'calendar-cell--empty': !cell.inCurrentMonth,
          'calendar-cell--today': cell.dateText === todayText,
          'calendar-cell--holiday': cell.raw?.holidayFlag,
          'calendar-cell--clickable': cell.clickable,
          'calendar-cell--muted': cell.muted,
          'calendar-cell--planned': cell.raw?.stageStartedFlag === false,
          'calendar-cell--overtime': cell.raw?.overtimeStageFlag
        }"
        :style="getDayBgStyle(cell.raw)"
        @click="handleDayClick(cell.raw)"
      >
        <template v-if="cell.dateText">
          <div class="calendar-cell__head">
            <span class="calendar-cell__day">{{ cell.day }}</span>
          </div>
          <div class="calendar-cell__body">
            <span
              v-if="getVisibleReportStatus(cell.raw)"
              class="cell-dot"
              :style="getStatusDotStyle(cell.raw)"
              :title="getStatusDotTitle(cell.raw)"
            ></span>
          </div>
        </template>
      </div>
    </div>

    <div class="calendar-footer">
      <div class="calendar-summary">
        <span class="summary-chip">
          <span class="summary-chip__label">已提交</span>
          <span class="summary-chip__value">{{ monthSummary.submitted }}</span>
        </span>
        <span class="summary-chip">
          <span class="summary-chip__label">未提交</span>
          <span class="summary-chip__value">{{ monthSummary.pending }}</span>
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.workbench-calendar {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.calendar-nav {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: rgb(var(--layout-bg-color));
  color: var(--n-text-color-2);
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: rgb(var(--border-color));
  }
}

.calendar-title {
  color: var(--n-text-color-1);
  font-size: 14px;
  font-weight: 600;
  min-width: 90px;
  text-align: center;
}

.today-btn {
  padding: 4px 12px;
  border: none;
  border-radius: 6px;
  background: rgb(var(--layout-bg-color));
  color: var(--n-text-color-2);
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: rgb(var(--border-color));
  }
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;
  padding: 6px 8px;
  border-radius: 8px;
  background: rgb(var(--layout-bg-color) / 60%);
}

.calendar-weekday {
  display: flex;
  height: 24px;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: var(--n-text-color-3);
  font-size: 11px;
  font-weight: 500;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;
}

.calendar-cell {
  display: flex;
  flex-direction: column;
  height: 34px;
  border: 1px solid var(--daily-stage-border, rgb(var(--border-color)));
  border-radius: 8px;
  background: var(--daily-stage-background, rgb(var(--container-bg-color)));
  color: var(--daily-stage-text, var(--n-text-color-1));
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;

  &--empty {
    background: transparent;
    border-color: transparent;
  }

  &--clickable {
    cursor: pointer;

    &:hover {
      border-color: var(--em-primary-color);
      box-shadow: 0 4px 12px rgb(var(--em-primary-color-rgb) / 12%);
      transform: translateY(-1px);
    }
  }

  &--today {
    box-shadow: inset 0 0 0 1px var(--em-primary-color);
  }

  &--holiday {
    opacity: 0.5;
    cursor: default;
  }

  &--muted {
    background: rgb(var(--layout-bg-color));
    color: var(--n-text-color-3);
  }

  &--planned {
    background:
      linear-gradient(135deg, rgb(var(--container-bg-color) / 78%), rgb(var(--layout-bg-color) / 88%)),
      var(--daily-stage-background, rgb(var(--layout-bg-color)));
  }

  &--overtime {
    border-color: rgb(208 48 80 / 72%);
  }
}

.calendar-cell__head {
  display: flex;
  align-items: center;
  justify-content: center;
}

.calendar-cell__day {
  font-size: 12px;
  font-weight: 600;
  color: var(--daily-stage-text, var(--n-text-color-1));
}

.calendar-cell__body {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 4px;
}

.cell-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: transparent;
}

.calendar-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 6px;
  border-top: 1px solid rgb(var(--border-color) / 50%);
}

.calendar-summary {
  display: flex;
  gap: 12px;
}

.summary-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  height: 26px;
  border-radius: 13px;
  background: rgb(var(--em-primary-color-rgb) / 0.08);
}

.summary-chip__label {
  color: var(--n-text-color-3);
  font-size: 11px;
}

.summary-chip__value {
  color: var(--em-primary-color);
  font-size: 12px;
  font-weight: 600;
}
</style>
