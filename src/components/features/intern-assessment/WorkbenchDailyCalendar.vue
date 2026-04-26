<script setup lang="ts">
import { NTag } from 'naive-ui';
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

const todayText = formatDateText(currentDate);

const monthLabel = computed(() => `${currentYear.value}年${currentMonth.value + 1}月`);

const calendarDays = computed(() => {
  const year = currentYear.value;
  const month = currentMonth.value;
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalDays = lastDay.getDate();

  const days: Array<{ dateText: string; day: number; raw: AssessmentPathDailyCalendarDayVo | null }> = [];

  for (let i = 0; i < startOffset; i++) {
    days.push({ dateText: '', day: 0, raw: null });
  }

  const dayMap = new Map<string, AssessmentPathDailyCalendarDayVo>();
  (props.calendar.days || []).forEach(d => {
    const key = formatDateText(d.date);
    if (key) dayMap.set(key, d);
  });

  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(year, month, d);
    const dateText = formatDateText(date);
    days.push({ dateText, day: d, raw: dayMap.get(dateText) || null });
  }

  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let i = 0; i < remaining; i++) {
      days.push({ dateText: '', day: 0, raw: null });
    }
  }

  return days;
});

const monthSummary = computed(() => {
  const days = props.calendar.days || [];
  const submitted = days.filter(d => d.submittedFlag).length;
  const pending = days.filter(d => d.expectedReportFlag && !d.submittedFlag).length;
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

  if (day.holidayFlag) {
    return {
      '--daily-stage-background': 'rgb(var(--layout-bg-color))',
      '--daily-stage-border': 'rgb(var(--border-color))',
      '--daily-stage-text': 'var(--n-text-color-3)',
      '--daily-stage-sub-text': 'var(--n-text-color-3)'
    };
  }

  const parsed = parseColor(day.stageColor);
  if (parsed) {
    return {
      '--daily-stage-background': toRgba(parsed, 0.14),
      '--daily-stage-border': toRgba(parsed, 0.28),
      '--daily-stage-text': getColorText(parsed),
      '--daily-stage-sub-text': getSubColorText(parsed)
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

function getDayStatusTagType(status?: string): 'default' | 'success' | 'warning' | 'error' | 'info' {
  if (status === 'submitted') return 'success';
  if (status === 'pending') return 'error';
  if (status === 'upcoming') return 'warning';
  return 'default';
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
        :key="index"
        class="calendar-cell"
        :class="{
          'calendar-cell--empty': !cell.dateText,
          'calendar-cell--today': cell.dateText === todayText,
          'calendar-cell--holiday': cell.raw?.holidayFlag,
          'calendar-cell--clickable': cell.raw && cell.dateText
        }"
        :style="getDayBgStyle(cell.raw)"
        @click="handleDayClick(cell.raw)"
      >
        <template v-if="cell.dateText">
          <div class="calendar-cell__head">
            <span class="calendar-cell__day">{{ cell.day }}</span>
          </div>
          <div class="calendar-cell__body">
            <span class="cell-dot" :class="{
              'cell-dot--success': cell.raw?.submittedFlag,
              'cell-dot--warning': cell.raw?.expectedReportFlag && !cell.raw?.submittedFlag
            }"></span>
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
          <span class="summary-chip__label">待提交</span>
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

  &--success {
    background: rgb(82 196 26);
  }

  &--warning {
    background: rgb(208 48 80);
  }
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
