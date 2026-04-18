<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NButton, NForm, NFormItem, NModal, NSelect, NSpin } from 'naive-ui';
import type { FormInst, FormRules, SelectOption } from 'naive-ui';
import DictTag from '@/components/common/DictTag.vue';
import { useDict } from '@/composables/use-dict';
import { fetchAssessmentPaperCreate, fetchAssessmentPathById, fetchAssessmentPathList } from '@/service/api';
import type { AssessmentInternPathStageVo, AssessmentPaperCreateBo, AssessmentInternPathVo, UserOptionVo } from '@/types/app';

interface Props {
  show: boolean;
  userOptions: UserOptionVo[];
  defaultUserId?: string | null;
  defaultPathId?: string | null;
  defaultPathStageId?: string | null;
  defaultPathStageName?: string | null;
  defaultPathStageStatus?: string | null;
  defaultTemplateName?: string | null;
  lockCurrentStage?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  defaultUserId: null,
  defaultPathId: null,
  defaultPathStageId: null,
  defaultPathStageName: null,
  defaultPathStageStatus: null,
  defaultTemplateName: null,
  lockCurrentStage: false
});

const emit = defineEmits<{
  close: [submitted?: boolean, paperId?: string];
}>();

const pathStageStatusDict = useDict('assessment_path_stage_status');

const formRef = ref<FormInst | null>(null);
const loading = ref(false);
const paths = ref<AssessmentInternPathVo[]>([]);
const stageOptions = ref<SelectOption[]>([]);
const currentStageInfo = ref({
  templateName: '',
  stageName: '',
  stageStatus: '',
  studyDays: '',
  startedAt: '',
  earliestAssessAt: '',
  latestAssessAt: '',
  timingStatus: '',
  timingDescription: ''
});

const formData = ref<AssessmentPaperCreateBo>({
  userId: undefined,
  pathId: undefined,
  pathStageId: undefined
});

const rules: FormRules = {
  userId: [{ required: true, message: '请选择实习生', trigger: ['change'] }],
  pathId: [{ required: true, message: '请选择培训计划', trigger: ['change'] }],
  pathStageId: [
    {
      trigger: ['change'],
      validator: () => {
        if (props.lockCurrentStage) return true;
        return Boolean(formData.value.pathStageId) || new Error('请选择考核阶段');
      }
    }
  ]
};

const userOptions = computed<SelectOption[]>(() =>
  props.userOptions.map(item => ({
    label: `${item.name || '-'}${item.employeeNo ? `（${item.employeeNo}）` : ''}`,
    value: item.id || ''
  }))
);

const pathOptions = computed<SelectOption[]>(() =>
  paths.value.map(item => ({
    label: `${item.templateName || '未命名模板'} / ${item.currentStageName || '未开始培训'}`,
    value: item.id || ''
  }))
);

function getPathStageStatusLabel(status?: string | null) {
  if (!status) return '-';
  return pathStageStatusDict.getLabel(status) || status;
}

watch(
  () => props.show,
  async visible => {
    if (!visible) return;

    formData.value = {
      userId: props.defaultUserId || undefined,
      pathId: props.defaultPathId || undefined,
      pathStageId: props.defaultPathStageId || undefined
    };

    currentStageInfo.value = {
      templateName: props.defaultTemplateName || '',
      stageName: props.defaultPathStageName || '',
      stageStatus: props.defaultPathStageStatus || '',
      studyDays: '',
      startedAt: '',
      earliestAssessAt: '',
      latestAssessAt: '',
      timingStatus: '',
      timingDescription: ''
    };

    stageOptions.value = [];
    formRef.value?.restoreValidation();

    if (props.defaultUserId) {
      await loadPaths(props.defaultUserId);
    }

    if (props.defaultPathId) {
      await loadPathStages(props.defaultPathId);
    }
  }
);

async function loadPaths(userId: string) {
  const { data, error } = await fetchAssessmentPathList({
    pageNum: 1,
    pageSize: 200,
    userId
  });

  if (error) {
    paths.value = [];
    return;
  }

  paths.value = data?.records || [];
}

async function loadPathStages(pathId: string) {
  const { data, error } = await fetchAssessmentPathById(pathId);
  if (error || !data) {
    stageOptions.value = [];
    return;
  }

  stageOptions.value = (data.stages || [])
    .filter(item => Boolean(item.id))
    .map(item => ({
      label: `${item.stageName || '-'} / ${getPathStageStatusLabel(item.status)}`,
      value: item.id || ''
    }));

  const currentStage =
    (data.stages || []).find(item => item.id === props.defaultPathStageId)
    || (data.stages || []).find(item => item.stageId === data.currentStageId)
    || (data.stages || []).find(item => ['in_progress', 'failed', 'pending'].includes(item.status || ''))
    || (data.stages || []).find(item => Boolean(item.id))
    || null;

  formData.value.pathId = data.id || formData.value.pathId;
  formData.value.pathStageId = currentStage?.id || props.defaultPathStageId || undefined;

  if (props.lockCurrentStage) {
    currentStageInfo.value = {
      templateName: data.templateName || props.defaultTemplateName || '',
      stageName: currentStage?.stageName || data.currentStageName || props.defaultPathStageName || '',
      stageStatus: props.defaultPathStageStatus || currentStage?.status || '',
      studyDays: resolveStudyDaysText(currentStage),
      startedAt: currentStage?.startedAt || '',
      earliestAssessAt: currentStage?.earliestAssessAt || '',
      latestAssessAt: currentStage?.latestAssessAt || '',
      timingStatus: currentStage?.timingStatus || '',
      timingDescription: currentStage?.timingDescription || ''
    };
  }
}

function resolveStudyDaysText(stage?: AssessmentInternPathStageVo | null) {
  if (!stage) return '';
  if (stage.minStudyDays == null && stage.maxStudyDays == null) return '未配置';
  if (stage.minStudyDays != null && stage.maxStudyDays != null) return `${stage.minStudyDays}-${stage.maxStudyDays}天`;
  if (stage.minStudyDays != null) return `不少于${stage.minStudyDays}天`;
  return `不超过${stage.maxStudyDays}天`;
}

async function handleUserChange(value: string | null) {
  formData.value.userId = value || undefined;
  formData.value.pathId = undefined;
  formData.value.pathStageId = undefined;
  stageOptions.value = [];

  if (!value) {
    paths.value = [];
    return;
  }

  await loadPaths(value);
}

async function handlePathChange(value: string | null) {
  formData.value.pathId = value || undefined;
  formData.value.pathStageId = undefined;
  stageOptions.value = [];

  if (!value) return;

  await loadPathStages(value);
}

function handleClose() {
  emit('close', false, undefined);
}

async function handleSubmit() {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }

  loading.value = true;
  try {
    const payload: AssessmentPaperCreateBo = {
      userId: formData.value.userId,
      pathId: formData.value.pathId,
      pathStageId: formData.value.pathStageId
    };

    const { data, error } = await fetchAssessmentPaperCreate(payload);
    if (error) return;

    window.$message?.success('阶段考核已生成');
    emit('close', true, data || undefined);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    title="发起阶段考核"
    :style="{ width: '640px' }"
    :mask-closable="false"
    @update:show="value => !value && handleClose()"
  >
    <NSpin :show="loading">
      <NForm ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="88">
        <NFormItem label="实习生" path="userId">
          <NSelect
            v-model:value="formData.userId"
            :options="userOptions"
            filterable
            placeholder="请选择实习生"
            :disabled="lockCurrentStage"
            @update:value="handleUserChange"
          />
        </NFormItem>

        <NFormItem label="培训计划" path="pathId">
          <NSelect
            v-model:value="formData.pathId"
            :options="pathOptions"
            placeholder="请选择培训计划"
            :disabled="lockCurrentStage"
            @update:value="handlePathChange"
          />
        </NFormItem>

        <NFormItem label="考核阶段" path="pathStageId">
          <NSelect
            v-model:value="formData.pathStageId"
            :options="stageOptions"
            placeholder="请选择考核阶段"
            :disabled="lockCurrentStage"
          />
        </NFormItem>

        <div v-if="lockCurrentStage" class="current-stage-box">
          <div class="current-stage-box__title">当前阶段考核信息</div>
          <div class="current-stage-box__item">培训模板：{{ currentStageInfo.templateName || '-' }}</div>
          <div class="current-stage-box__item">当前培训阶段：{{ currentStageInfo.stageName || '-' }}</div>
          <div class="current-stage-box__item current-stage-box__item--inline">
            <span>培训阶段状态：</span>
            <DictTag dict-code="assessment_path_stage_status" :value="currentStageInfo.stageStatus" />
          </div>
          <div class="current-stage-box__item">学习时间：{{ currentStageInfo.studyDays || '-' }}</div>
          <div class="current-stage-box__item">培训开始时间：{{ currentStageInfo.startedAt || '-' }}</div>
          <div class="current-stage-box__item">最早考核：{{ currentStageInfo.earliestAssessAt || '-' }}</div>
          <div class="current-stage-box__item">最晚考核：{{ currentStageInfo.latestAssessAt || '-' }}</div>
          <div class="current-stage-box__item current-stage-box__item--inline">
            <span>时间状态：</span>
            <DictTag dict-code="assessment_stage_timing_status" :value="currentStageInfo.timingStatus" :fallback-label="currentStageInfo.timingStatus || '-'" />
          </div>
          <div class="current-stage-box__item">时间说明：{{ currentStageInfo.timingDescription || '-' }}</div>
          <div class="current-stage-box__tip">说明：学习期内允许提前考核；到达建议时间或超时后，系统会自动标记。</div>
        </div>
      </NForm>
    </NSpin>

    <template #action>
      <div class="em-dialog-actions">
        <NButton @click="handleClose">取消</NButton>
        <NButton type="primary" @click="handleSubmit">发起考核</NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped lang="scss">
.current-stage-box {
  padding: 12px 14px;
  border-radius: 10px;
  background: rgb(var(--layout-bg-color));
  box-shadow: inset 0 0 0 1px rgb(var(--border-color) / 85%);
}

.current-stage-box__title {
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
}

.current-stage-box__item {
  line-height: 1.8;
  color: var(--n-text-color-2);
}

.current-stage-box__item--inline {
  display: flex;
  align-items: center;
  gap: 8px;
}

.current-stage-box__tip {
  margin-top: 8px;
  color: var(--n-text-color-3);
  font-size: 12px;
  line-height: 1.7;
}
</style>
