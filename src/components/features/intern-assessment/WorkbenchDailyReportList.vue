<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { NButton, NEmpty, NInput, NTag } from 'naive-ui';
import type { AssessmentStageDailyReportVo } from '@/types/app';
import { fetchAssessmentPathStageDailySave } from '@/service/api';

interface Props {
  reports: AssessmentStageDailyReportVo[];
  pathId: string;
  pathStageId: string;
  canEditToday: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  reports: () => [],
  pathId: '',
  pathStageId: '',
  canEditToday: false
});

const emit = defineEmits<{
  saved: [];
}>();

const todayText = formatDateText(new Date());
const submitting = ref(false);

const workbenchForm = reactive({
  id: '',
  content: '',
  problem: '',
  plan: '',
  remark: ''
});

const todayReport = computed(() =>
  props.reports.find(r => formatDateText(r.reportDate) === todayText) || null
);

const historyReports = computed(() =>
  props.reports
    .filter(r => formatDateText(r.reportDate) !== todayText)
    .sort((a, b) => {
      const dateA = a.reportDate || '';
      const dateB = b.reportDate || '';
      return dateB.localeCompare(dateA);
    })
);

const isEditing = computed(() => props.canEditToday);

watch(
  () => todayReport.value,
  report => {
    workbenchForm.id = report?.id || '';
    workbenchForm.content = report?.content || '';
    workbenchForm.problem = report?.problem || '';
    workbenchForm.plan = report?.plan || '';
    workbenchForm.remark = report?.remark || '';
  },
  { immediate: true }
);

async function handleSubmit() {
  if (!isEditing.value || !props.pathId || !props.pathStageId) return;

  if (!String(workbenchForm.content || '').trim()) {
    window.$message?.warning('请填写日报内容');
    return;
  }

  submitting.value = true;
  try {
    const { error } = await fetchAssessmentPathStageDailySave({
      id: workbenchForm.id || undefined,
      pathId: props.pathId,
      pathStageId: props.pathStageId,
      reportDate: todayText,
      content: workbenchForm.content.trim(),
      problem: workbenchForm.problem.trim(),
      plan: workbenchForm.plan.trim(),
      remark: workbenchForm.remark.trim()
    });

    if (error) return;

    window.$message?.success('日报已保存');
    emit('saved');
  } finally {
    submitting.value = false;
  }
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

function formatDateTime(value?: string | Date | null) {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}
</script>

<template>
  <div class="workbench-daily-report-list">
    <div class="report-list__section">
      <div class="report-list__title">
        <span>今日日报</span>
        <NTag
          size="small"
          :bordered="false"
          :type="todayReport ? 'success' : 'warning'"
        >
          {{ todayReport ? '已提交' : '未提交' }}
        </NTag>
      </div>

      <div class="today-report">
        <div class="report-form">
          <div class="report-form__field">
            <div class="report-form__label">内容</div>
            <NInput
              v-model:value="workbenchForm.content"
              type="textarea"
              placeholder="填写今日学习和完成情况"
              :disabled="!isEditing"
              :autosize="{ minRows: 3, maxRows: 6 }"
            />
          </div>
          <div class="report-form__field">
            <div class="report-form__label">问题</div>
            <NInput
              v-model:value="workbenchForm.problem"
              type="textarea"
              placeholder="填写遇到的问题"
              :disabled="!isEditing"
              :autosize="{ minRows: 2, maxRows: 4 }"
            />
          </div>
          <div class="report-form__field">
            <div class="report-form__label">计划</div>
            <NInput
              v-model:value="workbenchForm.plan"
              type="textarea"
              placeholder="填写明日计划"
              :disabled="!isEditing"
              :autosize="{ minRows: 2, maxRows: 4 }"
            />
          </div>
          <div class="report-form__field">
            <div class="report-form__label">备注</div>
            <NInput
              v-model:value="workbenchForm.remark"
              type="textarea"
              placeholder="填写补充说明"
              :disabled="!isEditing"
              :autosize="{ minRows: 2, maxRows: 4 }"
            />
          </div>
          <div v-if="isEditing" class="report-form__actions">
            <NButton
              type="primary"
              size="small"
              :loading="submitting"
              @click="handleSubmit"
            >
              {{ todayReport ? '更新日报' : '提交日报' }}
            </NButton>
          </div>
        </div>
      </div>
    </div>

    <div class="report-list__section">
      <div class="report-list__title">
        <span>历史日报</span>
        <NTag size="small" :bordered="false" type="info">{{ historyReports.length }}</NTag>
      </div>

      <div v-if="historyReports.length" class="history-list">
        <div
          v-for="report in historyReports"
          :key="report.id || report.reportDate"
          class="history-item"
        >
          <div class="history-item__header">
            <span class="history-item__date">{{ formatDateText(report.reportDate) }}</span>
          </div>
          <div class="history-item__content">
            <div v-if="report.content" class="history-item__line">
              <span class="history-item__label">内容</span>
              <span class="history-item__text">{{ report.content }}</span>
            </div>
            <div v-if="report.problem" class="history-item__line">
              <span class="history-item__label">问题</span>
              <span class="history-item__text">{{ report.problem }}</span>
            </div>
            <div v-if="report.plan" class="history-item__line">
              <span class="history-item__label">计划</span>
              <span class="history-item__text">{{ report.plan }}</span>
            </div>
          </div>
          <div class="history-item__footer">
            <span class="history-item__time">{{ formatDateTime(report.updatedAt || report.createdAt) }}</span>
          </div>
        </div>
      </div>

      <NEmpty v-else description="暂无历史日报" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.workbench-daily-report-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 12px;
  border-radius: 12px;
  background: rgb(var(--container-bg-color));
  box-shadow:
    inset 0 0 0 1px rgb(var(--border-color)),
    0 1px 2px rgb(31 35 41 / 4%);
}

.report-list__section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.report-list__title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--n-text-color-1);
  font-size: 13px;
  font-weight: 600;
}

.report-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.report-form__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.report-form__label {
  color: var(--n-text-color-2);
  font-size: 12px;
  font-weight: 500;
}

.report-form__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: rgb(var(--layout-bg-color));
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgb(var(--border-color));
    border-radius: 2px;
  }
}

.history-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgb(var(--layout-bg-color));
  box-shadow: inset 0 0 0 1px rgb(var(--border-color) / 72%);
}

.history-item__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.history-item__date {
  color: var(--n-text-color-1);
  font-size: 12px;
  font-weight: 600;
}

.history-item__content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.history-item__line {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  gap: 6px;
  align-items: start;
}

.history-item__label {
  color: var(--n-text-color-3);
  font-size: 11px;
}

.history-item__text {
  color: var(--n-text-color-2);
  font-size: 11px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.history-item__footer {
  display: flex;
  justify-content: flex-end;
}

.history-item__time {
  color: var(--n-text-color-3);
  font-size: 10px;
}
</style>
