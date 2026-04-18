<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  NButton,
  NDynamicInput,
  NForm,
  NFormItem,
  NGrid,
  NGi,
  NInput,
  NInputNumber,
  NModal,
  NSelect,
  NSpin
} from 'naive-ui';
import type { FormInst, FormRules, SelectOption } from 'naive-ui';
import DictSelect from '@/components/common/DictSelect.vue';
import { fetchAssessmentQuestionAdd, fetchAssessmentQuestionUpdate } from '@/service/api';
import type { AssessmentQuestionBo, AssessmentQuestionVo } from '@/types/app';

interface Props {
  show: boolean;
  data?: AssessmentQuestionVo | null;
  stageOptions: SelectOption[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [submitted?: boolean];
}>();

const formRef = ref<FormInst | null>(null);
const submitting = ref(false);
const isEdit = computed(() => Boolean(props.data?.id));

const formData = ref<AssessmentQuestionBo>(createDefaultForm());

const needOptions = computed(() => ['single', 'multiple'].includes(String(formData.value.questionType || '')));
const isJudge = computed(() => formData.value.questionType === 'judge');

const rules: FormRules = {
  stageId: [{ required: true, message: '请选择所属阶段', trigger: ['change'] }],
  questionType: [{ required: true, message: '请选择题型', trigger: ['change'] }],
  stem: [{ required: true, message: '请输入题干', trigger: ['input', 'blur'] }],
  status: [{ required: true, message: '请选择状态', trigger: ['change'] }]
};

watch(
  () => props.show,
  visible => {
    if (visible) {
      formData.value = createFormData(props.data);
      formRef.value?.restoreValidation();
    }
  }
);

watch(
  () => formData.value.questionType,
  value => {
    if (value === 'judge') {
      formData.value.options = [];
      if (!['true', 'false'].includes(String(formData.value.answerContent || ''))) {
        formData.value.answerContent = 'true';
      }
      return;
    }

    if (value === 'single' || value === 'multiple') {
      if (!formData.value.options?.length) {
        formData.value.options = [
          { optionKey: 'A', optionLabel: '', sort: 1 },
          { optionKey: 'B', optionLabel: '', sort: 2 }
        ];
      }
      return;
    }

    formData.value.options = [];
  }
);

function createDefaultForm(): AssessmentQuestionBo {
  return {
    stageId: undefined,
    questionType: undefined,
    stem: '',
    knowledgePoint: '',
    difficulty: undefined,
    score: 0,
    answerContent: '',
    analysis: '',
    sort: 0,
    status: '1',
    options: []
  };
}

function createFormData(data?: AssessmentQuestionVo | null): AssessmentQuestionBo {
  if (!data) {
    return createDefaultForm();
  }

  return {
    id: data.id,
    stageId: data.stageId,
    questionType: data.questionType,
    stem: data.stem || '',
    knowledgePoint: data.knowledgePoint || '',
    difficulty: data.difficulty,
    score: data.score ?? 0,
    answerContent: data.answerContent || '',
    analysis: data.analysis || '',
    sort: data.sort ?? 0,
    status: data.status || '1',
    options: (data.options || []).map(item => ({
      id: item.id,
      questionId: item.questionId,
      optionKey: item.optionKey || '',
      optionLabel: item.optionLabel || '',
      sort: item.sort ?? 0
    }))
  };
}

function handleAddOption() {
  const nextIndex = (formData.value.options?.length || 0) + 1;
  formData.value.options = [...(formData.value.options || []), createOptionItem(nextIndex)];
}

function createOptionItem(index = (formData.value.options?.length || 0) + 1) {
  return {
    optionKey: String.fromCharCode(64 + index),
    optionLabel: '',
    sort: index
  };
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
    const payload: AssessmentQuestionBo = {
      ...formData.value,
      stem: formData.value.stem?.trim(),
      knowledgePoint: formData.value.knowledgePoint?.trim() || undefined,
      analysis: formData.value.analysis?.trim() || undefined,
      answerContent: formData.value.answerContent?.trim() || undefined,
      options: needOptions.value
        ? (formData.value.options || [])
            .filter(item => item.optionKey && item.optionLabel)
            .map((item, index) => ({
              ...item,
              optionKey: item.optionKey?.trim(),
              optionLabel: item.optionLabel?.trim(),
              sort: item.sort ?? index + 1
            }))
        : []
    };

    const { error } = isEdit.value ? await fetchAssessmentQuestionUpdate(payload) : await fetchAssessmentQuestionAdd(payload);
    if (error) {
      return;
    }

    window.$message?.success(isEdit.value ? '题目更新成功' : '题目新增成功');
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
    :title="isEdit ? '编辑题目' : '新增题目'"
    :style="{ width: '980px' }"
    :mask-closable="false"
    @update:show="value => !value && handleClose()"
  >
    <NSpin :show="submitting">
      <NForm ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="88">
        <NGrid :cols="2" :x-gap="16">
          <NGi>
            <NFormItem label="所属阶段" path="stageId">
              <NSelect v-model:value="formData.stageId" :options="stageOptions" placeholder="请选择所属阶段" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="题型" path="questionType">
              <DictSelect v-model:model-value="formData.questionType" dict-code="assessment_question_type" placeholder="请选择题型" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="难度" path="difficulty">
              <DictSelect v-model:model-value="formData.difficulty" dict-code="assessment_question_difficulty" clearable placeholder="请选择难度" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="分值" path="score">
              <NInputNumber v-model:value="formData.score" :min="0" style="width: 100%" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="排序" path="sort">
              <NInputNumber v-model:value="formData.sort" :min="0" style="width: 100%" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="状态" path="status">
              <DictSelect v-model:model-value="formData.status" dict-code="assessment_enable_status" placeholder="请选择状态" />
            </NFormItem>
          </NGi>
          <NGi span="2">
            <NFormItem label="知识点" path="knowledgePoint">
              <NInput v-model:value="formData.knowledgePoint" placeholder="请输入知识点" />
            </NFormItem>
          </NGi>
          <NGi span="2">
            <NFormItem label="题干" path="stem">
              <NInput v-model:value="formData.stem" type="textarea" :rows="4" placeholder="请输入题干" />
            </NFormItem>
          </NGi>
          <NGi span="2" v-if="isJudge">
            <NFormItem label="标准答案" path="answerContent">
              <DictSelect
                v-model:model-value="formData.answerContent"
                dict-code="assessment_judge_answer"
                placeholder="请选择正确答案"
              />
            </NFormItem>
          </NGi>
          <NGi span="2" v-else>
            <NFormItem label="标准答案" path="answerContent">
              <NInput
                v-model:value="formData.answerContent"
                type="textarea"
                :rows="3"
                :placeholder="needOptions ? '单选填 A，多选填 A,B 这种格式' : '请输入标准答案'"
              />
            </NFormItem>
          </NGi>
          <NGi span="2">
            <NFormItem label="解析" path="analysis">
              <NInput v-model:value="formData.analysis" type="textarea" :rows="3" placeholder="请输入题目解析" />
            </NFormItem>
          </NGi>
        </NGrid>

        <template v-if="needOptions">
          <div class="mb-12px mt-12px flex items-center justify-between">
            <div class="text-16px font-600">选项列表</div>
            <NButton text type="primary" @click="handleAddOption">新增选项</NButton>
          </div>
          <NDynamicInput v-model:value="formData.options" :min="0" :on-create="() => createOptionItem()">
            <template #default="{ value }">
              <NGrid :cols="24" :x-gap="12" class="mb-8px w-full">
                <NGi span="4"><NInput v-model:value="value.optionKey" placeholder="选项标识" /></NGi>
                <NGi span="16"><NInput v-model:value="value.optionLabel" placeholder="选项内容" /></NGi>
                <NGi span="4"><NInputNumber v-model:value="value.sort" :min="0" style="width: 100%" placeholder="排序" /></NGi>
              </NGrid>
            </template>
          </NDynamicInput>
        </template>
      </NForm>
    </NSpin>

    <template #action>
      <div class="em-dialog-actions">
        <NButton @click="handleClose">取消</NButton>
        <NButton type="primary" @click="handleSubmit">保存</NButton>
      </div>
    </template>
  </NModal>
</template>
