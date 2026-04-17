<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NButton, NDatePicker, NDynamicInput, NForm, NFormItem, NGrid, NGi, NInput, NInputNumber, NModal, NSelect, NSpin } from 'naive-ui';
import type { FormInst, FormRules, SelectOption } from 'naive-ui';
import DictSelect from '@/components/common/DictSelect.vue';
import { fetchAssessmentPathAdd, fetchAssessmentPathCalculate, fetchAssessmentPathUpdate, fetchAssessmentTemplateById } from '@/service/api';
import type { AssessmentInternPathBo, AssessmentInternPathVo, AssessmentScheduleCalcStageVo, UserOptionVo } from '@/types/app';

interface Props {
  show: boolean;
  data?: AssessmentInternPathVo | null;
  userOptions: UserOptionVo[];
  templateOptions: SelectOption[];
  stageOptions: SelectOption[];
}

interface FormModel {
  id?: string;
  userId?: string;
  templateId?: string;
  trainingStartDate: number | null;
  trainingEndDate: number | null;
  status?: string;
  stages: FormStage[];
}

interface FormStage {
  id?: string;
  stageId?: string;
  stageName?: string;
  sort?: number;
  sourceType?: string;
  status?: string;
  minStudyDays?: number;
  maxStudyDays?: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [submitted?: boolean];
}>();

const formRef = ref<FormInst | null>(null);
const submitting = ref(false);
const templateLoading = ref(false);
const scheduleCalculating = ref(false);
const trainingEndDateTouched = ref(false);
const isEdit = ref(false);
const stageEditorVisible = ref(false);

const formData = ref<FormModel>(createDefaultForm());
const scheduleTips = ref({
  recommendedTrainingStartDate: '',
  autoTrainingEndDate: '',
  adjustedTrainingEndDate: '',
  startDateAdjusted: false,
  endDateAdjusted: false
});
const scheduleStages = ref<AssessmentScheduleCalcStageVo[]>([]);
const timelineStages = computed(() =>
  (formData.value.stages || []).map((stage, index) => {
    const scheduleStage = findScheduleStage(stage);
    return {
      key: `${stage.stageId || 'empty'}-${stage.sort ?? index}`,
      order: stage.sort ?? index + 1,
      stageName: stage.stageName || `阶段 ${index + 1}`,
      studyDaysText: formatStudyDays({
        minStudyDays: stage.minStudyDays,
        maxStudyDays: stage.maxStudyDays
      }),
      previewText: formatStagePreview(stage),
      windowText: formatStageWindow(stage),
      startDate: scheduleStage?.plannedStartDate || '',
      endDate: scheduleStage?.latestAssessDate || scheduleStage?.earliestAssessDate || '',
      hasSchedule: Boolean(scheduleStage?.plannedStartDate)
    };
  })
);

const rules: FormRules = {
  userId: [{ required: true, message: '请选择实习生', trigger: ['change'] }],
  trainingStartDate: [{ required: true, type: 'number', message: '请选择培训开始日期', trigger: ['change', 'blur'] }],
  trainingEndDate: [{ required: true, type: 'number', message: '请选择预计结束日期', trigger: ['change', 'blur'] }],
  stages: [
    {
      validator: () => ((formData.value.stages || []).length ? true : new Error('请至少配置一个阶段')),
      trigger: ['change', 'blur']
    }
  ]
};

watch(
  () => props.show,
  visible => {
    if (!visible) return;
    isEdit.value = Boolean(props.data?.id);
    formData.value = createFormData(props.data);
    trainingEndDateTouched.value = Boolean(props.data?.trainingEndDate);
    stageEditorVisible.value = false;
    scheduleTips.value = {
      recommendedTrainingStartDate: props.data?.trainingStartDate || '',
      autoTrainingEndDate: props.data?.trainingEndDate || '',
      adjustedTrainingEndDate: props.data?.trainingEndDate || '',
      startDateAdjusted: false,
      endDateAdjusted: false
    };
    scheduleStages.value = [];
    formRef.value?.restoreValidation();
    void triggerScheduleCalculate();
  }
);

watch(
  () => [
    formData.value.trainingStartDate,
    formData.value.templateId,
    JSON.stringify((formData.value.stages || []).map(item => [item.stageId, item.sort, item.sourceType, item.status, item.minStudyDays, item.maxStudyDays]))
  ],
  () => {
    if (!props.show) return;
    void triggerScheduleCalculate();
  }
);

function createDefaultForm(): FormModel {
  return {
    userId: undefined,
    templateId: undefined,
    trainingStartDate: null,
    trainingEndDate: null,
    status: 'not_started',
    stages: []
  };
}

function createFormData(data?: AssessmentInternPathVo | null): FormModel {
  if (!data) {
    return createDefaultForm();
  }
  return {
    id: data.id,
    userId: data.userId,
    templateId: data.templateId,
    trainingStartDate: parseDateToTimestamp(data.trainingStartDate),
    trainingEndDate: parseDateToTimestamp(data.trainingEndDate),
    status: data.status || 'not_started',
    stages: (data.stages || []).map(item => ({
      id: item.id,
      stageId: item.stageId,
      stageName: item.stageName,
      sort: item.sort ?? 0,
      sourceType: item.sourceType || 'template',
      status: item.status || 'pending',
      minStudyDays: item.minStudyDays,
      maxStudyDays: item.maxStudyDays
    }))
  };
}

function parseDateToTimestamp(value?: string | null) {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function formatDate(value?: number | null) {
  if (!value) return '';
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildPayload(includeManualEndDate = true): AssessmentInternPathBo {
  return {
    id: formData.value.id,
    userId: formData.value.userId,
    templateId: formData.value.templateId,
    trainingStartDate: formatDate(formData.value.trainingStartDate) || undefined,
    trainingEndDate: includeManualEndDate && trainingEndDateTouched.value ? formatDate(formData.value.trainingEndDate) || undefined : undefined,
    status: formData.value.status,
    stages: (formData.value.stages || [])
      .filter(item => item.stageId)
      .map((item, index) => ({
        id: item.id,
        stageId: item.stageId,
        stageName: item.stageName,
        sort: item.sort ?? index + 1,
        sourceType: item.sourceType || 'manual',
        status: item.status || 'pending',
        minStudyDays: item.minStudyDays,
        maxStudyDays: item.maxStudyDays
      }))
  };
}

function createStageItem() {
  return {
    stageId: undefined,
    sort: (formData.value.stages?.length || 0) + 1,
    sourceType: 'manual',
    status: 'pending',
    minStudyDays: undefined,
    maxStudyDays: undefined
  };
}

function handleAddStage() {
  formData.value.stages = [...(formData.value.stages || []), createStageItem()];
}

function toggleStageEditor() {
  stageEditorVisible.value = !stageEditorVisible.value;
}

function findStageOption(stageId?: string) {
  return props.stageOptions.find(item => item.value === stageId) as (SelectOption & { minStudyDays?: number; maxStudyDays?: number }) | undefined;
}

function syncStageDuration(stage: FormStage, stageId: string | null) {
  stage.stageId = stageId || undefined;
  const option = findStageOption(stage.stageId);
  stage.stageName = typeof option?.label === 'string' ? option.label.replace(/（.*）$/, '') : stage.stageName;
  stage.minStudyDays = option?.minStudyDays;
  stage.maxStudyDays = option?.maxStudyDays;
  void triggerScheduleCalculate();
}

function updateStageStudyDays(stage: FormStage, field: 'minStudyDays' | 'maxStudyDays', value: number | null) {
  stage[field] = value == null ? undefined : value;
  if (stage.minStudyDays != null && stage.maxStudyDays != null && stage.minStudyDays > stage.maxStudyDays) {
    if (field === 'minStudyDays') {
      stage.maxStudyDays = stage.minStudyDays;
    } else {
      stage.minStudyDays = stage.maxStudyDays;
    }
  }
  void triggerScheduleCalculate();
}

async function handleTemplateChange(value: string | null) {
  formData.value.templateId = value || undefined;
  if (!value) {
    formData.value.stages = [];
    trainingEndDateTouched.value = false;
    await triggerScheduleCalculate();
    return;
  }

  templateLoading.value = true;
  try {
    const { data, error } = await fetchAssessmentTemplateById(value);
    if (error || !data) return;

    formData.value.stages = (data.stages || []).map((item, index) => ({
      stageId: item.stageId,
      stageName: item.stageNameSnapshot,
      sort: item.sort ?? index + 1,
      sourceType: 'template',
      status: 'pending',
      minStudyDays: item.minStudyDays ?? findStageOption(item.stageId)?.minStudyDays,
      maxStudyDays: item.maxStudyDays ?? findStageOption(item.stageId)?.maxStudyDays
    }));
    trainingEndDateTouched.value = false;
    await triggerScheduleCalculate();
  } finally {
    templateLoading.value = false;
  }
}

async function triggerScheduleCalculate() {
  if (!formData.value.trainingStartDate) {
    scheduleTips.value = {
      recommendedTrainingStartDate: '',
      autoTrainingEndDate: '',
      adjustedTrainingEndDate: '',
      startDateAdjusted: false,
      endDateAdjusted: false
    };
    scheduleStages.value = [];
    if (!trainingEndDateTouched.value) {
      formData.value.trainingEndDate = null;
    }
    return;
  }

  if (!formData.value.templateId && !(formData.value.stages || []).length) {
    return;
  }

  scheduleCalculating.value = true;
  try {
    const { data, error } = await fetchAssessmentPathCalculate(buildPayload(false));
    if (error || !data) return;

    scheduleTips.value = {
      recommendedTrainingStartDate: data.recommendedTrainingStartDate || '',
      autoTrainingEndDate: data.autoTrainingEndDate || '',
      adjustedTrainingEndDate: data.adjustedTrainingEndDate || '',
      startDateAdjusted: Boolean(data.startDateAdjusted),
      endDateAdjusted: Boolean(data.endDateAdjusted)
    };
    scheduleStages.value = data.stages || [];

    if (!trainingEndDateTouched.value || !formData.value.trainingEndDate) {
      formData.value.trainingEndDate = parseDateToTimestamp(data.adjustedTrainingEndDate);
    }
  } finally {
    scheduleCalculating.value = false;
  }
}

function handleTrainingEndDateChange(value: number | null) {
  formData.value.trainingEndDate = value;
  trainingEndDateTouched.value = value !== null;
  void triggerScheduleCalculate();
}

function formatStudyDays(stage: AssessmentScheduleCalcStageVo) {
  if (stage.minStudyDays == null && stage.maxStudyDays == null) return '未配置学习时长，请先在阶段管理中维护';
  if (stage.minStudyDays != null && stage.maxStudyDays != null) return `${stage.minStudyDays}-${stage.maxStudyDays} 天`;
  if (stage.minStudyDays != null) return `不少于 ${stage.minStudyDays} 天`;
  return `不超过 ${stage.maxStudyDays} 天`;
}

function formatStageTimeline(stage: AssessmentScheduleCalcStageVo) {
  if (!stage.plannedStartDate) return '-';
  if (!stage.earliestAssessDate && !stage.latestAssessDate) {
    return `${stage.plannedStartDate} 开始`;
  }
  if (stage.earliestAssessDate && stage.latestAssessDate && stage.earliestAssessDate !== stage.latestAssessDate) {
    return `${stage.plannedStartDate} 开始，考核窗口 ${stage.earliestAssessDate} ~ ${stage.latestAssessDate}`;
  }
  return `${stage.plannedStartDate} 开始，预计考核 ${stage.latestAssessDate || stage.earliestAssessDate || '-'}`;
}

function findScheduleStage(stage: FormStage) {
  return scheduleStages.value.find(item => item.stageId === stage.stageId && item.sort === stage.sort)
    || scheduleStages.value.find(item => item.stageId === stage.stageId)
    || null;
}

function formatStagePreview(stage: FormStage) {
  const scheduleStage = findScheduleStage(stage);
  if (scheduleStage) return formatStageTimeline(scheduleStage);
  return formData.value.trainingStartDate ? '等待系统计算时间预估' : '选择培训开始日期后自动计算具体时间';
}

function formatStageWindow(stage: FormStage) {
  const scheduleStage = findScheduleStage(stage);
  if (!scheduleStage?.earliestAssessDate && !scheduleStage?.latestAssessDate) return '暂未生成考核窗口';
  if (scheduleStage?.earliestAssessDate && scheduleStage?.latestAssessDate && scheduleStage.earliestAssessDate !== scheduleStage.latestAssessDate) {
    return `建议考核时间：${scheduleStage.earliestAssessDate} ~ ${scheduleStage.latestAssessDate}`;
  }
  return `建议考核时间：${scheduleStage?.latestAssessDate || scheduleStage?.earliestAssessDate || '-'}`;
}

function handleClose() {
  emit('close', false);
}

async function handleSubmit() {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }

  submitting.value = true;
  try {
    const payload = buildPayload();
    const { error } = isEdit.value ? await fetchAssessmentPathUpdate(payload) : await fetchAssessmentPathAdd(payload);
    if (error) return;

    window.$message?.success(isEdit.value ? '考核路径更新成功' : '考核路径新增成功');
    emit('close', true);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <NModal
    :show="show"
    class="path-dialog-modal"
    preset="card"
    :title="isEdit ? '编辑考核路径' : '新增考核路径'"
    :style="{ width: '1220px' }"
    :mask-closable="false"
    @update:show="value => !value && handleClose()"
  >
    <NSpin :show="submitting || templateLoading || scheduleCalculating">
      <NForm ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="120">
        <NGrid :cols="2" :x-gap="16">
          <NGi>
            <NFormItem label="实习生" path="userId">
              <NSelect
                v-model:value="formData.userId"
                :options="userOptions.map(item => ({ label: `${item.name || '-'}${item.employeeNo ? `（${item.employeeNo}）` : ''}`, value: item.id || '' }))"
                filterable
                placeholder="请选择实习生"
              />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="路径模板" path="templateId">
              <NSelect
                v-model:value="formData.templateId"
                :options="templateOptions"
                clearable
                placeholder="选择模板后自动带出阶段"
                @update:value="handleTemplateChange"
              />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="培训开始日期" path="trainingStartDate">
              <NDatePicker v-model:value="formData.trainingStartDate" type="date" clearable style="width: 100%" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="预计结束日期" path="trainingEndDate">
              <NDatePicker
                v-model:value="formData.trainingEndDate"
                type="date"
                clearable
                style="width: 100%"
                placeholder="自动计算后可手动调整"
                @update:value="handleTrainingEndDateChange"
              />
            </NFormItem>
          </NGi>
          <NGi span="2">
            <NFormItem label="路径状态" path="status">
              <DictSelect v-model:model-value="formData.status" dict-code="assessment_path_status" placeholder="请选择路径状态" />
            </NFormItem>
          </NGi>
          <NGi span="2">
            <div class="date-tips">
              <div class="date-tips__item">自动开始日期：{{ scheduleTips.recommendedTrainingStartDate || '-' }}</div>
              <div class="date-tips__item">最终结束日期：{{ scheduleTips.adjustedTrainingEndDate || '-' }}</div>
              <div class="date-tips__item">系统会自动跳过法定节假日、周末，并兼容调休上班日。</div>
            </div>
          </NGi>
        </NGrid>

        <div class="section-header">
          <div>
            <div class="section-header__title">阶段安排</div>
            <div class="section-header__subtitle">默认展示路径时间轴，需要时再展开编辑阶段。</div>
          </div>
          <div class="section-header__actions">
            <NButton text type="primary" @click="toggleStageEditor">
              {{ stageEditorVisible ? '收起编辑' : '编辑阶段' }}
            </NButton>
            <NButton v-if="stageEditorVisible" text type="primary" @click="handleAddStage">新增阶段</NButton>
          </div>
        </div>

        <div class="stage-layout" :class="{ 'stage-layout--preview-only': !stageEditorVisible }">
          <div v-if="stageEditorVisible" class="stage-layout__main">
            <NDynamicInput v-model:value="formData.stages" :min="0" :on-create="createStageItem">
              <template #default="{ value }">
                <div class="stage-item-card">
                  <NGrid :cols="24" :x-gap="12" class="w-full">
                    <NGi span="8">
                      <div class="stage-item-card__label">阶段</div>
                      <NSelect
                        v-model:value="value.stageId"
                        :options="stageOptions"
                        placeholder="请选择阶段"
                        @update:value="stageId => syncStageDuration(value, stageId)"
                      />
                    </NGi>
                    <NGi span="3">
                      <div class="stage-item-card__label">排序</div>
                      <NInputNumber v-model:value="value.sort" :min="0" style="width: 100%" placeholder="排序" />
                    </NGi>
                    <NGi span="4">
                      <div class="stage-item-card__label">最少学习天数</div>
                      <NInputNumber
                        :value="value.minStudyDays ?? null"
                        :min="0"
                        clearable
                        style="width: 100%"
                        placeholder="如 2"
                        @update:value="input => updateStageStudyDays(value, 'minStudyDays', input)"
                      />
                    </NGi>
                    <NGi span="4">
                      <div class="stage-item-card__label">最多学习天数</div>
                      <NInputNumber
                        :value="value.maxStudyDays ?? null"
                        :min="0"
                        clearable
                        style="width: 100%"
                        placeholder="如 5"
                        @update:value="input => updateStageStudyDays(value, 'maxStudyDays', input)"
                      />
                    </NGi>
                    <NGi span="2">
                      <div class="stage-item-card__label">来源</div>
                      <NSelect
                        v-model:value="value.sourceType"
                        :options="[
                          { label: '模板生成', value: 'template' },
                          { label: '手动配置', value: 'manual' }
                        ]"
                        placeholder="来源"
                      />
                    </NGi>
                    <NGi span="3">
                      <div class="stage-item-card__label">阶段状态</div>
                      <DictSelect v-model:model-value="value.status" dict-code="assessment_path_stage_status" placeholder="阶段状态" />
                    </NGi>
                    <NGi span="24">
                      <div class="stage-item-card__timeline">
                        <div class="stage-item-card__summary">
                          <span class="stage-item-card__summary-title">学习时长</span>
                          <span>{{ formatStudyDays(value) }}</span>
                        </div>
                        <div class="stage-item-card__summary">
                          <span class="stage-item-card__summary-title">时间预估</span>
                          <span>{{ formatStagePreview(value) }}</span>
                        </div>
                        <div class="stage-item-card__summary stage-item-card__summary--muted">
                          {{ formatStageWindow(value) }}
                        </div>
                      </div>
                    </NGi>
                  </NGrid>
                </div>
              </template>
            </NDynamicInput>
          </div>

          <div class="stage-layout__side">
            <div class="path-preview-card">
              <div class="path-preview-card__header">
                <div class="path-preview-card__title">路径时间轴</div>
                <div class="path-preview-card__subtitle">实时预览整条考核路径</div>
              </div>

              <div v-if="timelineStages.length" class="path-timeline">
                <div v-for="(stage, index) in timelineStages" :key="stage.key" class="path-timeline__item">
                  <div class="path-timeline__line" :class="{ 'path-timeline__line--last': index === timelineStages.length - 1 }">
                    <div class="path-timeline__dot" :class="{ 'path-timeline__dot--ready': stage.hasSchedule }">
                      {{ stage.order }}
                    </div>
                  </div>
                  <div class="path-timeline__content">
                    <div class="path-timeline__title">{{ stage.stageName }}</div>
                    <div class="path-timeline__meta">{{ stage.studyDaysText }}</div>
                    <div class="path-timeline__meta">{{ stage.previewText }}</div>
                    <div class="path-timeline__meta path-timeline__meta--soft">{{ stage.windowText }}</div>
                  </div>
                </div>
              </div>

              <div v-else class="path-preview-card__empty">先选择模板或手动新增阶段，再配置学习时间。</div>
            </div>
          </div>
        </div>
      </NForm>
    </NSpin>

    <template #action>
      <div class="flex justify-end gap-12px">
        <NButton @click="handleClose">取消</NButton>
        <NButton type="primary" @click="handleSubmit">保存</NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped lang="scss">
:deep(.path-dialog-modal > .n-card) {
  max-height: calc(100vh - 40px);
  overflow: hidden;
}

:deep(.path-dialog-modal .n-card__content) {
  overflow-y: auto;
}

:deep(.path-dialog-modal .n-card__action) {
  position: sticky;
  bottom: 0;
  z-index: 2;
  background: rgb(var(--layout-bg-color));
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  margin-bottom: 12px;
  gap: 16px;
}

.section-header__title {
  font-size: 16px;
  font-weight: 600;
}

.section-header__subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: var(--n-text-color-3);
}

.section-header__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.date-tips {
  padding: 12px 14px;
  border-radius: 10px;
  background: rgb(var(--layout-bg-color));
  box-shadow: inset 0 0 0 1px rgb(var(--border-color) / 85%);
}

.date-tips__item {
  line-height: 1.8;
  color: var(--n-text-color-2);
}

.stage-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.85fr);
  gap: 16px;
  align-items: start;
}

.stage-layout--preview-only {
  grid-template-columns: minmax(0, 1fr);
}

.stage-layout__main,
.stage-layout__side {
  min-width: 0;
}

.stage-item-card {
  margin-bottom: 12px;
  padding: 14px;
  border-radius: 12px;
  background: rgb(var(--layout-bg-color));
  box-shadow: inset 0 0 0 1px rgb(var(--border-color) / 85%);
}

.stage-item-card__label {
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--n-text-color-3);
}

.stage-item-card__timeline {
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 10px;
  background: rgb(var(--body-color));
  box-shadow: inset 0 0 0 1px rgb(var(--border-color) / 55%);
}

.stage-item-card__summary {
  display: flex;
  gap: 8px;
  align-items: baseline;
  line-height: 1.8;
  color: var(--n-text-color-2);
}

.stage-item-card__summary-title {
  flex: 0 0 72px;
  color: var(--n-text-color-3);
}

.stage-item-card__summary--muted {
  margin-top: 2px;
}

.path-preview-card {
  position: sticky;
  top: 0;
  padding: 16px;
  border-radius: 14px;
  background: linear-gradient(180deg, rgb(var(--layout-bg-color)) 0%, rgb(var(--body-color)) 100%);
  box-shadow: inset 0 0 0 1px rgb(var(--border-color) / 85%);
}

.stage-layout--preview-only .path-preview-card {
  max-width: 100%;
}

.path-preview-card__header {
  margin-bottom: 14px;
}

.path-preview-card__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--n-text-color);
}

.path-preview-card__subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: var(--n-text-color-3);
}

.path-timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.path-timeline__item {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 12px;
}

.path-timeline__line {
  position: relative;
  display: flex;
  justify-content: center;
  padding-bottom: 14px;
}

.path-timeline__line::after {
  content: '';
  position: absolute;
  top: 30px;
  bottom: 0;
  width: 1px;
  background: rgb(var(--border-color) / 75%);
}

.path-timeline__line--last::after {
  display: none;
}

.path-timeline__dot {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgb(var(--layout-bg-color));
  color: var(--n-text-color-3);
  box-shadow: inset 0 0 0 1px rgb(var(--border-color) / 95%);
  font-size: 12px;
  font-weight: 600;
}

.path-timeline__dot--ready {
  background: rgba(var(--primary-color), 0.16);
  color: rgb(var(--primary-color));
  box-shadow: inset 0 0 0 1px rgba(var(--primary-color), 0.35);
}

.path-timeline__content {
  padding-bottom: 14px;
}

.path-timeline__title {
  font-weight: 600;
  color: var(--n-text-color);
}

.path-timeline__meta {
  margin-top: 4px;
  line-height: 1.7;
  color: var(--n-text-color-2);
}

.path-timeline__meta--soft {
  color: var(--n-text-color-3);
}

.path-preview-card__empty {
  padding: 18px 12px;
  border-radius: 10px;
  background: rgb(var(--layout-bg-color));
  color: var(--n-text-color-3);
  text-align: center;
  box-shadow: inset 0 0 0 1px rgb(var(--border-color) / 55%);
}

@media (max-width: 1200px) {
  .stage-layout {
    grid-template-columns: 1fr;
  }

  .path-preview-card {
    position: static;
  }
}
</style>
