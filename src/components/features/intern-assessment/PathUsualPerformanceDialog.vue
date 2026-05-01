<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NButton, NForm, NFormItem, NGrid, NGi, NInput, NModal, NSpace } from 'naive-ui';
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

const formRef = ref<FormInst | null>(null);
const submitting = ref(false);
const formData = ref<AssessmentPathUsualPerformanceBo>(createDefaultForm());

const fields: FieldMeta[] = [
  {
    key: 'usualTechAbility',
    levelKey: 'usualTechAbilityLevel',
    label: '技术能力',
    placeholder: '请输入技术能力评价'
  },
  {
    key: 'usualCommunicationAbility',
    label: '沟通能力',
    placeholder: '请输入沟通能力评价'
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
    key: 'usualPersonality',
    label: '性格',
    placeholder: '请输入性格评价'
  },
  {
    key: 'usualProblemUnderstanding',
    levelKey: 'usualProblemUnderstandingLevel',
    label: '问题理解能力',
    placeholder: '请输入问题理解能力评价'
  }
];

const hasContent = computed(() =>
  fields.some(field =>
    Boolean(String(props.data?.[field.key] || '').trim())
    || Boolean(field.levelKey && String(props.data?.[field.levelKey] || '').trim())
  )
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
    usualAttitudeLevel: undefined,
    usualTechAbility: '',
    usualTechAbilityLevel: undefined,
    usualCommunicationAbility: '',
    usualProblemUnderstanding: '',
    usualProblemUnderstandingLevel: undefined,
    usualSelfLearning: '',
    usualSelfLearningLevel: undefined,
    usualPressureResistance: '',
    usualPressureResistanceLevel: undefined,
    usualProblemSolving: '',
    usualProblemSolvingLevel: undefined
  };
}

function createFormData(pathId?: string | null, data?: AssessmentInternPathVo | null): AssessmentPathUsualPerformanceBo {
  return {
    pathId: pathId || undefined,
    usualPersonality: data?.usualPersonality || '',
    usualAttitude: data?.usualAttitude || '',
    usualAttitudeLevel: data?.usualAttitudeLevel || undefined,
    usualTechAbility: data?.usualTechAbility || '',
    usualTechAbilityLevel: data?.usualTechAbilityLevel || undefined,
    usualCommunicationAbility: data?.usualCommunicationAbility || '',
    usualProblemUnderstanding: data?.usualProblemUnderstanding || '',
    usualProblemUnderstandingLevel: data?.usualProblemUnderstandingLevel || undefined,
    usualSelfLearning: data?.usualSelfLearning || '',
    usualSelfLearningLevel: data?.usualSelfLearningLevel || undefined,
    usualPressureResistance: data?.usualPressureResistance || '',
    usualPressureResistanceLevel: data?.usualPressureResistanceLevel || undefined,
    usualProblemSolving: data?.usualProblemSolving || '',
    usualProblemSolvingLevel: data?.usualProblemSolvingLevel || undefined
  };
}

function handleClose() {
  emit('close', false);
}

async function handleSubmit() {
  if (!formData.value.pathId) {
    window.$message?.warning('培训计划ID不能为空');
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
    <NForm ref="formRef" :model="formData" label-placement="left" :label-width="104">
      <NGrid :cols="2" :x-gap="16" :y-gap="4" responsive="screen" item-responsive>
        <NGi v-for="field in fields" :key="field.key" span="2 s:2 m:1">
          <div class="usual-performance-block">
            <NFormItem v-if="field.levelKey" :label="`${field.label}等级`">
              <DictSelect
                v-model:model-value="formData[field.levelKey]"
                dict-code="assessment_usual_performance_level"
                clearable
                placeholder="请选择评价等级"
              />
            </NFormItem>
            <NFormItem :label="`${field.label}评价`">
              <NInput
                v-model:value="formData[field.key]"
                type="textarea"
                :autosize="{ minRows: 3, maxRows: 5 }"
                :placeholder="field.placeholder"
              />
            </NFormItem>
          </div>
        </NGi>
      </NGrid>
    </NForm>

    <template #footer>
      <NSpace justify="end" :size="16">
        <NButton @click="handleClose">取消</NButton>
        <NButton type="primary" :loading="submitting" @click="handleSubmit">保存</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped lang="scss">
.usual-performance-block {
  border-radius: 12px;
}
</style>
