<script setup lang="ts">
import { computed, h, onMounted, reactive, ref } from 'vue';
import { NButton, NDataTable, NDatePicker, NEmpty, NGrid, NGi, NModal, NSpace, NSelect, NTag, useThemeVars } from 'naive-ui';
import type { DataTableColumns, SelectOption } from 'naive-ui';
import SearchTablePageLayout from '@/components/pages/SearchTablePageLayout.vue';
import { fetchAssessmentDailyReportCalendar, fetchAssessmentDailyReportDateDetail, fetchAssessmentTemplateList, fetchUserOptions } from '@/service/api';
import type {
  AssessmentDailyReportCalendarDayVo,
  AssessmentDailyReportCalendarVo,
  AssessmentDailyReportDateDetailVo,
  AssessmentDailyReportDetailItemVo,
  UserOptionVo
} from '@/types/app';

definePageMeta({
  title: '日报管理'
});

interface CalendarCell extends AssessmentDailyReportCalendarDayVo {
  key: string;
  dateText: string;
}

const loading = ref(false);
const detailLoading = ref(false);
const themeVars = useThemeVars();
const monthPickerValue = ref<number | null>(createMonthTimestamp(new Date()));
const monthData = ref<AssessmentDailyReportCalendarVo | null>(null);
const detailVisible = ref(false);
const detailData = ref<AssessmentDailyReportDateDetailVo | null>(null);
const detailDate = ref('');
const templateOptions = ref<SelectOption[]>([]);
const userOptions = ref<UserOptionVo[]>([]);

const searchParams = reactive({
  month: formatMonthValue(monthPickerValue.value),
  templateId: null as string | null,
  userId: null as string | null
});

const weekdayLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

const userSelectOptions = computed<SelectOption[]>(() =>
  userOptions.value.map(item => ({
    label: `${item.name || '-'}${item.employeeNo ? `（${item.employeeNo}）` : ''}`,
    value: item.id || ''
  }))
);

const calendarCells = computed<(CalendarCell | null)[]>(() => {
  const days = monthData.value?.days || [];
  const selectedMonth = searchParams.month || formatMonthValue(Date.now());
  const firstDate = new Date(`${selectedMonth}-01T00:00:00`);
  const offset = ((firstDate.getDay() || 7) - 1) % 7;
  const cells: (CalendarCell | null)[] = Array.from({ length: offset }, () => null);
  days.forEach((item, index) => {
    cells.push({
      ...item,
      key: item.date || `${index}`,
      dateText: item.date || ''
    });
  });
  const remainder = cells.length % 7;
  if (remainder > 0) {
    cells.push(...Array.from({ length: 7 - remainder }, () => null));
  }
  return cells;
});

const weekRowCount = computed(() => {
  const count = Math.ceil(calendarCells.value.length / 7);
  return count > 0 ? count : 5;
});

const detailColumns = computed<DataTableColumns<AssessmentDailyReportDetailItemVo>>(() => [
  {
    title: '姓名',
    key: 'userName',
    width: 120,
    fixed: 'left',
    render: row => row.userName || '-'
  },
  {
    title: '工号',
    key: 'employeeNo',
    width: 110,
    render: row => row.employeeNo || '-'
  },
  {
    title: '培训模板',
    key: 'templateName',
    width: 160,
    render: row => row.templateName || '-'
  },
  {
    title: '当日阶段',
    key: 'stageName',
    width: 140,
    render: row => row.stageName || '-'
  },
  {
    title: '提交状态',
    key: 'submitted',
    width: 110,
    align: 'center',
    render: row =>
      h(
        NTag,
        {
          bordered: false,
          type: row.submitted ? 'success' : 'default'
        },
        { default: () => (row.submitted ? '已提交' : '未提交') }
      )
  },
  {
    title: '提交时间',
    key: 'updatedAt',
    width: 170,
    render: row => row.updatedAt || '-'
  },
  {
    title: '今日情况',
    key: 'content',
    minWidth: 220,
    render: row => row.content || '-'
  },
  {
    title: '问题记录',
    key: 'problem',
    minWidth: 220,
    render: row => row.problem || '-'
  },
  {
    title: '明日计划',
    key: 'plan',
    minWidth: 220,
    render: row => row.plan || '-'
  },
  {
    title: '备注',
    key: 'remark',
    minWidth: 180,
    render: row => row.remark || '-'
  }
]);

onMounted(async () => {
  await Promise.all([loadTemplateOptions(), loadUserOptions()]);
  await loadCalendar();
});

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

async function loadUserOptions() {
  const { data, error } = await fetchUserOptions({ userType: 'intern' });
  if (error) {
    userOptions.value = [];
    return;
  }
  userOptions.value = data || [];
}

async function loadCalendar() {
  loading.value = true;
  try {
    const { data, error } = await fetchAssessmentDailyReportCalendar({
      month: searchParams.month,
      templateId: searchParams.templateId || undefined,
      userId: searchParams.userId || undefined
    });
    if (error) {
      monthData.value = null;
      return;
    }
    monthData.value = data || null;
  } finally {
    loading.value = false;
  }
}

async function openDateDetail(date?: string) {
  if (!date) return;
  detailVisible.value = true;
  detailDate.value = date;
  detailLoading.value = true;
  try {
    const { data, error } = await fetchAssessmentDailyReportDateDetail({
      date,
      templateId: searchParams.templateId || undefined,
      userId: searchParams.userId || undefined
    });
    if (error) {
      detailData.value = null;
      return;
    }
    detailData.value = data || null;
  } finally {
    detailLoading.value = false;
  }
}

function handleSearch() {
  searchParams.month = formatMonthValue(monthPickerValue.value);
  loadCalendar();
}

function handleReset() {
  monthPickerValue.value = createMonthTimestamp(new Date());
  searchParams.month = formatMonthValue(monthPickerValue.value);
  searchParams.templateId = null;
  searchParams.userId = null;
  loadCalendar();
}

function createMonthTimestamp(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1).getTime();
}

function formatMonthValue(value?: number | null) {
  const date = value ? new Date(value) : new Date();
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  return `${year}-${month}`;
}

function dayStatusType(day: AssessmentDailyReportCalendarDayVo) {
  const total = day.totalCount || 0;
  const submitted = day.submittedCount || 0;
  if (total === 0) return 'default';
  if (submitted === total) return 'success';
  if (submitted === 0) return 'error';
  return 'warning';
}

function dayStatusText(day: AssessmentDailyReportCalendarDayVo) {
  const total = day.totalCount || 0;
  const submitted = day.submittedCount || 0;
  if (total === 0) return '无计划';
  if (submitted === total) return '全部提交';
  if (submitted === 0) return '未提交';
  return '部分提交';
}
</script>

<template>
  <SearchTablePageLayout @refresh="loadCalendar">
    <template #searchBox>
      <NGrid :cols="12" :x-gap="12" :y-gap="12">
        <NGi span="12">
          <NSpace justify="end">
            <NDatePicker v-model:value="monthPickerValue" type="month" clearable style="width: 180px" />
            <NSelect v-model:value="searchParams.templateId" :options="templateOptions" clearable placeholder="培训模板" style="width: 180px" />
            <NSelect v-model:value="searchParams.userId" :options="userSelectOptions" clearable filterable placeholder="实习生" style="width: 220px" />
            <NButton type="primary" @click="handleSearch">查询</NButton>
            <NButton @click="handleReset">重置</NButton>
          </NSpace>
        </NGi>
      </NGrid>
    </template>

    <div class="daily-report-page">
      <div class="calendar-panel">
        <div class="calendar-weekdays">
          <div v-for="item in weekdayLabels" :key="item" class="calendar-weekdays__item">{{ item }}</div>
        </div>

        <div v-if="calendarCells.length" class="calendar-grid" :style="{ gridTemplateRows: `repeat(${weekRowCount}, minmax(0, 1fr))` }">
          <div
            v-for="(cell, index) in calendarCells"
            :key="cell?.key || `empty-${index}`"
            class="calendar-cell"
            :class="{ 'calendar-cell--empty': !cell }"
          >
            <template v-if="cell">
              <button class="day-card" type="button" @click="openDateDetail(cell.date)">
                <div class="day-card__header">
                  <span class="day-card__date">{{ cell.dayOfMonth }}</span>
                  <NTag size="small" :bordered="false" :type="dayStatusType(cell)">
                    {{ dayStatusText(cell) }}
                  </NTag>
                </div>
                <div class="day-card__metrics">
                  <div class="day-card__metric">
                    <span>应提交</span>
                    <strong>{{ cell.totalCount || 0 }}</strong>
                  </div>
                  <div class="day-card__metric">
                    <span>已提交</span>
                    <strong class="success-text">{{ cell.submittedCount || 0 }}</strong>
                  </div>
                  <div class="day-card__metric">
                    <span>未提交</span>
                    <strong class="warning-text">{{ cell.pendingCount || 0 }}</strong>
                  </div>
                </div>
              </button>
            </template>
          </div>
        </div>

        <div v-else class="calendar-empty">
          <NEmpty description="暂无日报数据" />
        </div>
      </div>
    </div>

    <NModal v-model:show="detailVisible" preset="card" :bordered="false" class="detail-modal" title="日报详情" size="huge">
      <div class="detail-summary">
        <NTag :bordered="false" type="info">{{ detailDate || '-' }}</NTag>
        <NTag :bordered="false" type="default">应提交 {{ detailData?.totalCount || 0 }}</NTag>
        <NTag :bordered="false" type="success">已提交 {{ detailData?.submittedCount || 0 }}</NTag>
        <NTag :bordered="false" type="warning">未提交 {{ detailData?.pendingCount || 0 }}</NTag>
      </div>

      <NDataTable
        :bordered="false"
        :single-line="false"
        :columns="detailColumns"
        :data="detailData?.records || []"
        :loading="detailLoading"
        :pagination="false"
        flex-height
        :max-height="520"
      />
    </NModal>
  </SearchTablePageLayout>
</template>

<style scoped lang="scss">
.daily-report-page {
  display: flex;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.calendar-panel {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  height: 100%;
  padding: 12px;
  border: 1px solid v-bind('themeVars.borderColor');
  border-radius: 16px;
  background: v-bind('themeVars.cardColor');
  box-shadow: v-bind('themeVars.boxShadow1');
  overflow: hidden;
}

.calendar-weekdays,
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 12px;
}

.calendar-weekdays {
  margin-bottom: 10px;
  flex-shrink: 0;
}

.calendar-weekdays__item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  border-radius: 10px;
  background: v-bind('themeVars.actionColor');
  color: v-bind('themeVars.textColor2');
  font-size: 13px;
  font-weight: 600;
}

.calendar-grid {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.calendar-cell {
  min-height: 0;
}

.calendar-cell--empty {
  border-radius: 14px;
  background: transparent;
}

.day-card {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: 12px;
  border: 1px solid v-bind('themeVars.borderColor');
  border-radius: 14px;
  background: v-bind('themeVars.bodyColor');
  box-shadow: v-bind('themeVars.boxShadow1');
  cursor: pointer;
  text-align: left;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
  flex-direction: column;
  justify-content: space-between;
}

.day-card:hover {
  border-color: v-bind('themeVars.primaryColor');
  box-shadow: v-bind('themeVars.boxShadow2');
  transform: translateY(-1px);
}

.day-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.day-card__date {
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
  color: v-bind('themeVars.textColor1');
}

.day-card__metrics {
  display: grid;
  gap: 6px;
}

.day-card__metric {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: v-bind('themeVars.textColor2');
  font-size: 12px;
}

.day-card__metric strong {
  color: v-bind('themeVars.textColor1');
  font-size: 13px;
}

.success-text {
  color: v-bind('themeVars.successColor') !important;
}

.warning-text {
  color: v-bind('themeVars.warningColor') !important;
}

.calendar-empty {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
}

.detail-modal {
  width: min(1280px, calc(100vw - 48px));
}

.detail-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

@media (max-width: 1200px) {
  .calendar-weekdays,
  .calendar-grid {
    gap: 10px;
  }
}
</style>
