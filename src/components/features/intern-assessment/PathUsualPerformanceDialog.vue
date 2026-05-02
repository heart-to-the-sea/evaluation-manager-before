<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NButton, NForm, NFormItem, NInput, NModal } from 'naive-ui';
import type { FormInst } from 'naive-ui';
import DictSelect from '@/components/common/DictSelect.vue';
import { fetchAssessmentPathUsualPerformanceSave } from '@/service/api';
import type { AssessmentInternPathVo, AssessmentPathUsualPerformanceBo } from '@/types/app';

interface Props {
  show: boolean;
  pathId?: string | null;
  data?: AssessmentInternPathVo | null;
}

type SelectFieldKey =
  | 'usualCommunicationAbilityLevel'
  | 'usualTechAbilityLevel'
  | 'usualAttitudeLevel'
  | 'usualPressureResistanceLevel'
  | 'usualProblemSolvingLevel'
  | 'usualSelfLearningLevel'
  | 'usualProblemUnderstandingLevel';

type TextFieldKey =
  | 'usualTechAbility'
  | 'usualCommunicationAbility'
  | 'usualAttitude'
  | 'usualPressureResistance'
  | 'usualProblemSolving'
  | 'usualSelfLearning'
  | 'usualPersonality'
  | 'usualProblemUnderstanding';

interface FieldMeta {
  key: TextFieldKey;
  label: string;
  placeholder: string;
  levelKey?: SelectFieldKey;
}

const props = withDefaults(defineProps<Props>(), {
  pathId: null,
  data: null
});

const emit = defineEmits<{
  close: [submitted?: boolean];
}>();

const DEFAULT_USUAL_LEVEL = 'ordinary';
const formRef = ref<FormInst | null>(null);
const submitting = ref(false);
const formData = ref<AssessmentPathUsualPerformanceBo>(createDefaultForm());

const fields: FieldMeta[] = [
  {
    key: 'usualPersonality',
    label: '性格',
    placeholder: '请输入性格评价'
  },
  {
    key: 'usualCommunicationAbility',
    levelKey: 'usualCommunicationAbilityLevel',
    label: '沟通能力',
    placeholder: '请输入沟通能力评价'
  },
  {
    key: 'usualTechAbility',
    levelKey: 'usualTechAbilityLevel',
    label: '技术能力',
    placeholder: '请输入技术能力评价'
  },
  {
    key: 'usualAttitude',
    levelKey: 'usualAttitudeLevel',
    label: '态度',
    placeholder: '请输入态度评价'
  },
  {
    key: 'usualPressureResistance',
    levelKey: 'usualPressureResistanceLevel',
    label: '抗压能力',
    placeholder: '请输入抗压能力评价'
  },
  {
    key: 'usualProblemSolving',
    levelKey: 'usualProblemSolvingLevel',
    label: '解决问题能力',
    placeholder: '请输入解决问题能力评价'
  },
  {
    key: 'usualSelfLearning',
    levelKey: 'usualSelfLearningLevel',
    label: '自学能力',
    placeholder: '请输入自学能力评价'
  },
  {
    key: 'usualProblemUnderstanding',
    levelKey: 'usualProblemUnderstandingLevel',
    label: '问题理解能力',
    placeholder: '请输入问题理解能力评价'
  }
];

const hasContent = computed(() =>
  fields.some(field => Boolean(String(props.data?.[field.key] || '').trim()) || Boolean(field.levelKey && String(props.data?.[field.levelKey] || '').trim()))
);

watch(
  () => props.show,
  visible => {
    if (!visible) return;
    formData.value = createFormData(props.pathId, props.data);
    formRef.value?.restoreValidation();
  }
);

function createDefaultForm(): AssessmentPathUsualPerformanceBo {
  return {
    pathId: undefined,
    usualPersonality: '',
    usualAttitude: '',
    usualAttitudeLevel: DEFAULT_USUAL_LEVEL,
    usualTechAbility: '',
    usualTechAbilityLevel: DEFAULT_USUAL_LEVEL,
    usualCommunicationAbility: '',
    usualCommunicationAbilityLevel: DEFAULT_USUAL_LEVEL,
    usualProblemUnderstanding: '',
    usualProblemUnderstandingLevel: DEFAULT_USUAL_LEVEL,
    usualSelfLearning: '',
    usualSelfLearningLevel: DEFAULT_USUAL_LEVEL,
    usualPressureResistance: '',
    usualPressureResistanceLevel: DEFAULT_USUAL_LEVEL,
    usualProblemSolving: '',
    usualProblemSolvingLevel: DEFAULT_USUAL_LEVEL
  };
}

function createFormData(pathId?: string | null, data?: AssessmentInternPathVo | null): AssessmentPathUsualPerformanceBo {
  return {
    pathId: pathId || undefined,
    usualPersonality: data?.usualPersonality || '',
    usualAttitude: data?.usualAttitude || '',
    usualAttitudeLevel: data?.usualAttitudeLevel || DEFAULT_USUAL_LEVEL,
    usualTechAbility: data?.usualTechAbility || '',
    usualTechAbilityLevel: data?.usualTechAbilityLevel || DEFAULT_USUAL_LEVEL,
    usualCommunicationAbility: data?.usualCommunicationAbility || '',
    usualCommunicationAbilityLevel: data?.usualCommunicationAbilityLevel || DEFAULT_USUAL_LEVEL,
    usualProblemUnderstanding: data?.usualProblemUnderstanding || '',
    usualProblemUnderstandingLevel: data?.usualProblemUnderstandingLevel || DEFAULT_USUAL_LEVEL,
    usualSelfLearning: data?.usualSelfLearning || '',
    usualSelfLearningLevel: data?.usualSelfLearningLevel || DEFAULT_USUAL_LEVEL,
    usualPressureResistance: data?.usualPressureResistance || '',
    usualPressureResistanceLevel: data?.usualPressureResistanceLevel || DEFAULT_USUAL_LEVEL,
    usualProblemSolving: data?.usualProblemSolving || '',
    usualProblemSolvingLevel: data?.usualProblemSolvingLevel || DEFAULT_USUAL_LEVEL
  };
}

function handleClose() {
  emit('close', false);
}

async function handleSubmit() {
  if (!formData.value.pathId) {
    window.$message?.warning('培训计划 ID 不能为空');
    return;
  }

  submitting.value = true;
  try {
    const { error, msg } = await fetchAssessmentPathUsualPerformanceSave({ ...formData.value });
    if (error) return;
    window.$message?.success(msg || '综合评价保存成功');
    emit('close', true);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    :title="hasContent ? '修改综合评价' : '编辑综合评价'"
    :style="{ width: '960px', maxWidth: 'calc(100vw - 32px)' }"
    :mask-closable="false"
    @update:show="value => !value && handleClose()"
  >
    <NForm ref="formRef" :model="formData" label-placement="left" :label-width="108" class="usual-performance-form">
      <div class="usual-performance-list">
        <div v-for="field in fields" :key="field.key" class="usual-performance-item">
          <NFormItem :label="field.label" class="usual-performance-item__form-item">
            <div class="usual-performance-item__body">
              <DictSelect
                v-if="field.levelKey"
                v-model:model-value="formData[field.levelKey]"
                class="usual-performance-item__level"
                dict-code="assessment_usual_performance_level"
                clearable
                placeholder="选择等级"
              />
              <NInput
                v-model:value="formData[field.key]"
                class="usual-performance-item__input"
                :placeholder="field.placeholder"
              />
            </div>
          </NFormItem>
        </div>
      </div>
    </NForm>

    <template #footer>
      <div class="em-dialog-actions">
        <NButton @click="handleClose">取消</NButton>
        <NButton type="primary" :loading="submitting" @click="handleSubmit">保存</NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped lang="scss">
.usual-performance-form {
  padding-top: 4px;
  background: transparent;
}

.usual-performance-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: transparent;
}

.usual-performance-item {
  padding: 0;
  background: transparent;
  box-shadow: none;
  border: 0;
}

.usual-performance-item__form-item {
  margin-bottom: 0;
}

.usual-performance-item__body {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.usual-performance-item__level {
  width: 168px;
  flex: 0 0 168px;
}

.usual-performance-item__input {
  flex: 1;
  min-width: 0;
}

:deep(.usual-performance-item__form-item .n-form-item-blank) {
  width: 100%;
  background: transparent;
}

:deep(.usual-performance-item__form-item .n-form-item-feedback-wrapper) {
  display: none;
}

:deep(.usual-performance-item__form-item .n-form-item) {
  background: transparent;
}

@media (width <= 768px) {
  .usual-performance-item__body {
    flex-direction: column;
    align-items: stretch;
  }

  .usual-performance-item__level {
    width: 100%;
    flex-basis: auto;
  }
}
</style>
