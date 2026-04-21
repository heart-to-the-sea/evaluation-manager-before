<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NButton, NForm, NFormItem, NInput, NModal, NSelect, NSpin } from 'naive-ui';
import type { FormInst, SelectOption } from 'naive-ui';
import DictSelect from '@/components/common/DictSelect.vue';
import { fetchAssessmentPaperItemRegenerate, fetchAssessmentQuestionList } from '@/service/api';

interface Props {
  show: boolean;
  paperId?: string | null;
  paperItemId?: string | null;
  stageId?: string | null;
  questionType?: string | null;
  currentQuestionId?: string | null;
  excludeQuestionIds?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  paperId: null,
  paperItemId: null,
  stageId: null,
  questionType: null,
  currentQuestionId: null,
  excludeQuestionIds: () => []
});

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const formRef = ref<FormInst | null>(null);
const loading = ref(false);
const submitting = ref(false);
const questionOptions = ref<SelectOption[]>([]);

const formData = ref({
  difficulty: null as string | null,
  knowledgePoints: '',
  questionId: null as string | null
});

const normalizedExcludeIds = computed(() =>
  [...new Set((props.excludeQuestionIds || []).filter(Boolean))]
);

watch(
  () => props.show,
  visible => {
    if (!visible) {
      formData.value = {
        difficulty: null,
        knowledgePoints: '',
        questionId: null
      };
      questionOptions.value = [];
      return;
    }
    loadQuestionOptions();
  },
  { immediate: true }
);

watch(
  () => [props.show, props.stageId, props.questionType, formData.value.difficulty, formData.value.knowledgePoints] as const,
  ([visible]) => {
    if (!visible) return;
    formData.value.questionId = null;
    loadQuestionOptions();
  }
);

async function loadQuestionOptions() {
  if (!props.show || !props.stageId || !props.questionType) {
    questionOptions.value = [];
    return;
  }

  loading.value = true;
  try {
    const { data, error } = await fetchAssessmentQuestionList({
      pageNum: 1,
      pageSize: 200,
      stageId: props.stageId,
      questionType: props.questionType,
      difficulty: formData.value.difficulty || undefined,
      knowledgePoint: formData.value.knowledgePoints || undefined,
      status: '1'
    });

    if (error) {
      questionOptions.value = [];
      return;
    }

    questionOptions.value = (data?.records || [])
      .filter(item => item.id && !normalizedExcludeIds.value.includes(item.id))
      .map(item => ({
        label: `${item.stem || '未命名题目'}${item.knowledgePoint ? `【${item.knowledgePoint}】` : ''}`,
        value: item.id || ''
      }));
  } finally {
    loading.value = false;
  }
}

function handleClose() {
  emit('close');
}

async function handleSubmit() {
  if (!props.paperId || !props.paperItemId) {
    return;
  }

  submitting.value = true;
  try {
    const { error } = await fetchAssessmentPaperItemRegenerate({
      paperId: props.paperId,
      paperItemId: props.paperItemId,
      difficulty: formData.value.difficulty || undefined,
      knowledgePoints: formData.value.knowledgePoints || undefined,
      questionId: formData.value.questionId || undefined
    });

    if (error) {
      return;
    }

    window.$message?.success('题目已重新随机');
    emit('success');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    title="重新随机题目"
    :style="{ width: '560px', maxWidth: 'calc(100vw - 32px)' }"
    :mask-closable="false"
    @update:show="value => !value && handleClose()"
  >
    <NSpin :show="loading || submitting">
      <NForm ref="formRef" :model="formData" label-placement="left" label-width="92">
        <NFormItem label="题目难度">
          <DictSelect v-model:model-value="formData.difficulty" dict-code="assessment_question_difficulty" clearable placeholder="不限制，按当前题型随机" />
        </NFormItem>
        <NFormItem label="知识范围">
          <NInput
            v-model:value="formData.knowledgePoints"
            clearable
            placeholder="请输入知识点，多个可用逗号分隔"
          />
        </NFormItem>
        <NFormItem label="指定题目">
          <NSelect
            v-model:value="formData.questionId"
            :options="questionOptions"
            filterable
            clearable
            placeholder="可直接指定题目，未选择则按条件随机"
          />
        </NFormItem>
      </NForm>
      <div class="paper-item-replace__tip">
        说明：仅会从当前培训阶段、相同题型、启用中的题目中进行替换；若选择指定题目，则优先使用该题目。
      </div>
    </NSpin>

    <template #action>
      <div class="em-dialog-actions">
        <NButton @click="handleClose">取消</NButton>
        <NButton type="primary" :loading="submitting" @click="handleSubmit">确认替换</NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped lang="scss">
.paper-item-replace__tip {
  margin-top: 12px;
  color: var(--n-text-color-3);
  font-size: 12px;
  line-height: 1.7;
}
</style>
