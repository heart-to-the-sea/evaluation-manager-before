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
import { fetchAssessmentStageAdd, fetchAssessmentStageUpdate } from '@/service/api';
import type { AssessmentStageBo, AssessmentStageVo } from '@/types/app';

interface Props {
  show: boolean;
  data?: AssessmentStageVo | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [submitted?: boolean];
}>();

const formRef = ref<FormInst | null>(null);
const submitting = ref(false);
const isEdit = computed(() => Boolean(props.data?.id));

const statusOptions: SelectOption[] = [
  { label: '启用', value: '1' },
  { label: '禁用', value: '0' }
];

const formData = ref<AssessmentStageBo>(createDefaultForm());

const rules: FormRules = {
  code: [{ required: true, message: '请输入阶段编码', trigger: ['input', 'blur'] }],
  name: [{ required: true, message: '请输入阶段名称', trigger: ['input', 'blur'] }],
  status: [{ required: true, message: '请选择状态', trigger: ['change'] }],
  maxStudyDays: [
    {
      trigger: ['change', 'blur'],
      validator: () => {
        if (
          formData.value.minStudyDays != null &&
          formData.value.maxStudyDays != null &&
          formData.value.minStudyDays > formData.value.maxStudyDays
        ) {
          return new Error('最大学习天数不能小于最小学习天数');
        }
        return true;
      }
    }
  ]
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

function createDefaultForm(): AssessmentStageBo {
  return {
    id: undefined,
    code: '',
    name: '',
    description: '',
    sort: 0,
    status: '1',
    minStudyDays: undefined,
    maxStudyDays: undefined,
    passScore: undefined,
    passRemark: '',
    materials: [],
    rules: []
  };
}

function createFormData(data?: AssessmentStageVo | null): AssessmentStageBo {
  if (!data) {
    return createDefaultForm();
  }

  return {
    id: data.id,
    code: data.code || '',
    name: data.name || '',
    description: data.description || '',
    sort: data.sort ?? 0,
    status: data.status || '1',
    minStudyDays: data.minStudyDays ?? undefined,
    maxStudyDays: data.maxStudyDays ?? undefined,
    passScore: data.passScore ?? undefined,
    passRemark: data.passRemark || '',
    materials: (data.materials || []).map(item => ({
      id: item.id,
      stageId: item.stageId,
      title: item.title || '',
      materialType: item.materialType || '',
      materialUrl: item.materialUrl || '',
      sort: item.sort ?? 0,
      remark: item.remark || ''
    })),
    rules: (data.rules || []).map(item => ({
      id: item.id,
      stageId: item.stageId,
      questionType: item.questionType || '',
      difficulty: item.difficulty || '',
      knowledgePoints: item.knowledgePoints || '',
      questionCount: item.questionCount ?? 0,
      score: item.score ?? undefined,
      sort: item.sort ?? 0
    }))
  };
}

function handleClose() {
  emit('close', false);
}

function handleAddMaterial() {
  formData.value.materials = [...(formData.value.materials || []), createMaterialItem()];
}

function handleAddRule() {
  formData.value.rules = [...(formData.value.rules || []), createRuleItem()];
}

function createMaterialItem() {
  return {
    title: '',
    materialType: '',
    materialUrl: '',
    sort: (formData.value.materials?.length || 0) + 1,
    remark: ''
  };
}

function createRuleItem() {
  return {
    questionType: '',
    difficulty: '',
    knowledgePoints: '',
    questionCount: 1,
    score: 0,
    sort: (formData.value.rules?.length || 0) + 1
  };
}

async function handleSubmit() {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }

  submitting.value = true;
  try {
    const payload: AssessmentStageBo = {
      ...formData.value,
      code: formData.value.code?.trim(),
      name: formData.value.name?.trim(),
      description: formData.value.description?.trim() || undefined,
      passRemark: formData.value.passRemark?.trim() || undefined,
      materials: (formData.value.materials || [])
        .filter(item => item.title || item.materialUrl)
        .map((item, index) => ({
          ...item,
          title: item.title?.trim(),
          materialType: item.materialType?.trim() || undefined,
          materialUrl: item.materialUrl?.trim() || undefined,
          remark: item.remark?.trim() || undefined,
          sort: item.sort ?? index + 1
        })),
      rules: (formData.value.rules || [])
        .filter(item => item.questionType && item.questionCount)
        .map((item, index) => ({
          ...item,
          knowledgePoints: item.knowledgePoints?.trim() || undefined,
          sort: item.sort ?? index + 1
        }))
    };

    const { error } = isEdit.value ? await fetchAssessmentStageUpdate(payload) : await fetchAssessmentStageAdd(payload);
    if (error) {
      return;
    }

    window.$message?.success(isEdit.value ? '阶段更新成功' : '阶段新增成功');
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
    :title="isEdit ? '编辑阶段' : '新增阶段'"
    :style="{ width: '980px' }"
    :mask-closable="false"
    @update:show="value => !value && handleClose()"
  >
    <NSpin :show="submitting">
      <NForm ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="100">
        <NGrid :cols="2" :x-gap="16">
          <NGi>
            <NFormItem label="阶段编码" path="code">
              <NInput v-model:value="formData.code" placeholder="请输入阶段编码" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="阶段名称" path="name">
              <NInput v-model:value="formData.name" placeholder="请输入阶段名称" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="状态" path="status">
              <NSelect v-model:value="formData.status" :options="statusOptions" placeholder="请选择状态" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="排序" path="sort">
              <NInputNumber v-model:value="formData.sort" :min="0" style="width: 100%" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="最小学习天数" path="minStudyDays">
              <NInputNumber v-model:value="formData.minStudyDays" :min="0" clearable style="width: 100%" placeholder="例如 2" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="最大学习天数" path="maxStudyDays">
              <NInputNumber v-model:value="formData.maxStudyDays" :min="0" clearable style="width: 100%" placeholder="例如 5" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="通过分数" path="passScore">
              <NInputNumber v-model:value="formData.passScore" :min="0" style="width: 100%" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="通过说明" path="passRemark">
              <NInput v-model:value="formData.passRemark" placeholder="请输入通过说明" />
            </NFormItem>
          </NGi>
          <NGi span="2">
            <NFormItem label="阶段说明" path="description">
              <NInput v-model:value="formData.description" type="textarea" :rows="3" placeholder="请输入阶段说明" />
            </NFormItem>
          </NGi>
        </NGrid>

        <div class="section-header">
          <div class="section-header__title">学习资料</div>
          <NButton text type="primary" @click="handleAddMaterial">新增资料</NButton>
        </div>
        <NDynamicInput v-model:value="formData.materials" :min="0" :on-create="createMaterialItem">
          <template #default="{ value }">
            <NGrid :cols="24" :x-gap="12" class="mb-8px w-full">
              <NGi span="5"><NInput v-model:value="value.title" placeholder="资料标题" /></NGi>
              <NGi span="4"><NInput v-model:value="value.materialType" placeholder="资料类型" /></NGi>
              <NGi span="8"><NInput v-model:value="value.materialUrl" placeholder="资料地址" /></NGi>
              <NGi span="3"><NInputNumber v-model:value="value.sort" :min="0" style="width: 100%" placeholder="排序" /></NGi>
              <NGi span="4"><NInput v-model:value="value.remark" placeholder="备注" /></NGi>
            </NGrid>
          </template>
        </NDynamicInput>

        <div class="section-header section-header--gap">
          <div class="section-header__title">抽题规则</div>
          <NButton text type="primary" @click="handleAddRule">新增规则</NButton>
        </div>
        <NDynamicInput v-model:value="formData.rules" :min="0" :on-create="createRuleItem">
          <template #default="{ value }">
            <NGrid :cols="24" :x-gap="12" class="mb-8px w-full">
              <NGi span="4">
                <DictSelect v-model:model-value="value.questionType" dict-code="assessment_question_type" placeholder="题型" />
              </NGi>
              <NGi span="4">
                <DictSelect v-model:model-value="value.difficulty" dict-code="assessment_question_difficulty" clearable placeholder="难度" />
              </NGi>
              <NGi span="7"><NInput v-model:value="value.knowledgePoints" placeholder="知识点，逗号分隔" /></NGi>
              <NGi span="3"><NInputNumber v-model:value="value.questionCount" :min="1" style="width: 100%" placeholder="题数" /></NGi>
              <NGi span="3"><NInputNumber v-model:value="value.score" :min="0" style="width: 100%" placeholder="分值" /></NGi>
              <NGi span="3"><NInputNumber v-model:value="value.sort" :min="0" style="width: 100%" placeholder="排序" /></NGi>
            </NGrid>
          </template>
        </NDynamicInput>
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
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  margin-bottom: 12px;
}

.section-header--gap {
  margin-top: 20px;
}

.section-header__title {
  font-size: 16px;
  font-weight: 600;
}
</style>
