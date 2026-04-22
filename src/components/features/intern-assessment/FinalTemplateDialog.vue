<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NButton, NDynamicInput, NForm, NFormItem, NGrid, NGi, NInput, NInputNumber, NModal, NSpin, NTag } from 'naive-ui';
import type { FormInst, FormRules } from 'naive-ui';
import DictSelect from '@/components/common/DictSelect.vue';
import { fetchAssessmentFinalTemplateAdd, fetchAssessmentFinalTemplateUpdate } from '@/service/api';
import type { AssessmentFinalTemplateBo, AssessmentFinalTemplateDimensionBo, AssessmentFinalTemplateVo } from '@/types/app';

interface Props {
  show: boolean;
  data?: AssessmentFinalTemplateVo | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [submitted?: boolean];
}>();

const formRef = ref<FormInst | null>(null);
const submitting = ref(false);
const isEdit = computed(() => Boolean(props.data?.id));
const formData = ref<AssessmentFinalTemplateBo>(createDefaultForm());

const rules: FormRules = {
  name: [{ required: true, message: '请输入模板名称', trigger: ['input', 'blur'] }],
  status: [{ required: true, message: '请选择状态', trigger: ['change'] }]
};

const totalScore = computed(() =>
  (formData.value.dimensions || []).reduce((total, dimension) => total + getDimensionScore(dimension), 0)
);

watch(
  () => props.show,
  visible => {
    if (visible) {
      formData.value = createFormData(props.data);
      formRef.value?.restoreValidation();
    }
  }
);

function createDefaultDimensions(): AssessmentFinalTemplateDimensionBo[] {
  return [
    {
      name: '工作能力',
      code: 'work_ability',
      description: '评价岗位基础技能、问题解决能力与学习成长表现',
      sort: 1,
      items: [
        { name: '快速掌握岗位基础技能，能独立完成基础工作任务', score: 12, sort: 1 },
        { name: '遇到问题能主动思考，及时请教，具备基本解决问题能力', score: 12, sort: 2 },
        { name: '学习能力强，能快速吸收新知识、新方法并运用到工作中', score: 11, sort: 3 }
      ]
    },
    {
      name: '工作成果',
      code: 'work_result',
      description: '评价任务完成质量、结果达成情况与工作优化贡献',
      sort: 2,
      items: [
        { name: '按时按质完成指导老师布置的各项工作任务', score: 9, sort: 1 },
        { name: '工作成果符合岗位要求，无明显失误', score: 8, sort: 2 },
        { name: '主动提出合理建议，为工作优化提供帮助（可选）', score: 8, sort: 3 }
      ]
    },
    {
      name: '沟通表达',
      code: 'communication',
      description: '评价日常沟通协作、表达反馈与团队配合情况',
      sort: 3,
      items: [
        { name: '与同事沟通顺畅，主动配合团队开展协作工作', score: 10, sort: 1 }
      ]
    }
  ];
}

function createDefaultForm(): AssessmentFinalTemplateBo {
  return {
    name: '',
    description: '',
    status: '1',
    dimensions: createDefaultDimensions()
  };
}

function createFormData(data?: AssessmentFinalTemplateVo | null): AssessmentFinalTemplateBo {
  if (!data) return createDefaultForm();
  return {
    id: data.id,
    name: data.name || '',
    description: data.description || '',
    status: data.status || '1',
    dimensions: (data.dimensions || []).map((dimension, dimensionIndex) => ({
      id: dimension.id,
      name: dimension.name || '',
      code: dimension.code || '',
      description: dimension.description || '',
      sort: dimension.sort ?? dimensionIndex + 1,
      items: (dimension.items || []).map((item, itemIndex) => ({
        id: item.id,
        name: item.name || '',
        description: item.description || '',
        score: Number(item.score || 0),
        sort: item.sort ?? itemIndex + 1
      }))
    }))
  };
}

function createDimensionItem(): AssessmentFinalTemplateDimensionBo {
  return {
    name: '',
    code: '',
    description: '',
    sort: (formData.value.dimensions?.length || 0) + 1,
    items: [createScoreItem(1)]
  };
}

function createScoreItem(sort?: number) {
  return {
    name: '',
    description: '',
    score: 0,
    sort: sort ?? 1
  };
}

function addDimension() {
  formData.value.dimensions = [...(formData.value.dimensions || []), createDimensionItem()];
}

function addScoreItem(dimension: AssessmentFinalTemplateDimensionBo) {
  dimension.items = [...(dimension.items || []), createScoreItem((dimension.items?.length || 0) + 1)];
}

function getDimensionScore(dimension: AssessmentFinalTemplateDimensionBo) {
  return (dimension.items || []).reduce((total, item) => total + Number(item.score || 0), 0);
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

  const dimensions = (formData.value.dimensions || []).map((dimension, dimensionIndex) => ({
    ...dimension,
    name: dimension.name?.trim(),
    code: dimension.code?.trim(),
    description: dimension.description?.trim() || undefined,
    sort: dimension.sort ?? dimensionIndex + 1,
    score: getDimensionScore(dimension),
    items: (dimension.items || []).map((item, itemIndex) => ({
      ...item,
      name: item.name?.trim(),
      description: item.description?.trim() || undefined,
      score: Number(item.score || 0),
      sort: item.sort ?? itemIndex + 1
    }))
  }));

  submitting.value = true;
  try {
    const payload: AssessmentFinalTemplateBo = {
      ...formData.value,
      name: formData.value.name?.trim(),
      description: formData.value.description?.trim() || undefined,
      totalScore: totalScore.value,
      dimensions
    };
    const { error } = isEdit.value ? await fetchAssessmentFinalTemplateUpdate(payload) : await fetchAssessmentFinalTemplateAdd(payload);
    if (error) return;
    window.$message?.success(isEdit.value ? '最终考核模板更新成功' : '最终考核模板新增成功');
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
    :title="isEdit ? '编辑最终考核模板' : '新增最终考核模板'"
    :style="{ width: '1080px', maxWidth: 'calc(100vw - 32px)' }"
    :mask-closable="false"
    @update:show="value => !value && handleClose()"
  >
    <NSpin :show="submitting">
      <NForm ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="92">
        <NGrid :cols="24" :x-gap="16">
          <NGi span="10">
            <NFormItem label="模板名称" path="name">
              <NInput v-model:value="formData.name" placeholder="请输入模板名称" />
            </NFormItem>
          </NGi>
          <NGi span="6">
            <NFormItem label="状态" path="status">
              <DictSelect v-model:model-value="formData.status" dict-code="assessment_enable_status" placeholder="请选择状态" />
            </NFormItem>
          </NGi>
          <NGi span="8">
            <div class="final-score-card">
              <span>模板总分</span>
              <strong>{{ totalScore }}</strong>
            </div>
          </NGi>
          <NGi span="24">
            <NFormItem label="模板说明" path="description">
              <NInput v-model:value="formData.description" type="textarea" :rows="2" placeholder="请输入模板说明" />
            </NFormItem>
          </NGi>
        </NGrid>

        <div class="final-template-toolbar">
          <div>
            <div class="final-template-title">评分维度与小项</div>
            <div class="final-template-subtitle">最终考核与阶段考核独立，可按维度配置多个评分小项。</div>
          </div>
          <NButton text type="primary" @click="addDimension">新增维度</NButton>
        </div>

        <NDynamicInput v-model:value="formData.dimensions" :min="0" :on-create="createDimensionItem">
          <template #default="{ value, index }">
            <div class="dimension-card">
              <div class="dimension-card__header">
                <div class="dimension-card__index">{{ index + 1 }}</div>
                <NInput v-model:value="value.name" placeholder="维度名称，如：工作能力" />
                <NInput v-model:value="value.code" placeholder="维度编码，如：work_ability" />
                <NInputNumber v-model:value="value.sort" :min="0" placeholder="排序" style="width: 110px" />
                <NTag type="info" :bordered="false">维度分 {{ getDimensionScore(value) }}</NTag>
              </div>
              <NInput v-model:value="value.description" class="mt-10px" placeholder="维度说明" />

              <div class="score-item-head">
                <span>评分小项</span>
                <NButton text type="primary" @click="addScoreItem(value)">新增小项</NButton>
              </div>

              <NDynamicInput v-model:value="value.items" :min="0" :on-create="() => createScoreItem((value.items?.length || 0) + 1)">
                <template #default="{ value: itemValue, index: itemIndex }">
                  <div class="score-item-row">
                    <div class="score-item-row__index">{{ itemIndex + 1 }}</div>
                    <NInput v-model:value="itemValue.name" placeholder="小项名称" />
                    <NInput v-model:value="itemValue.description" placeholder="评分说明" />
                    <NInputNumber v-model:value="itemValue.score" :min="0" :precision="1" placeholder="分值" style="width: 110px" />
                    <NInputNumber v-model:value="itemValue.sort" :min="0" placeholder="排序" style="width: 100px" />
                  </div>
                </template>
              </NDynamicInput>
            </div>
          </template>
        </NDynamicInput>
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

<style scoped lang="scss">
.final-score-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 34px;
  padding: 0 14px;
  border: 1px solid rgb(var(--em-primary-color-rgb) / 0.22);
  border-radius: 8px;
  background: rgb(var(--em-primary-color-rgb) / 0.08);
  color: var(--n-text-color-2);

  strong {
    color: var(--em-primary-color);
    font-size: 18px;
  }
}

.final-template-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 6px 0 12px;
}

.final-template-title {
  font-size: 16px;
  font-weight: 600;
}

.final-template-subtitle {
  margin-top: 2px;
  color: var(--n-text-color-2);
  font-size: 13px;
}

.dimension-card {
  width: 100%;
  margin-bottom: 12px;
  padding: 14px;
  border: 1px solid var(--n-border-color);
  border-radius: 10px;
  background: var(--container-bg-color);
}

.dimension-card__header,
.score-item-row {
  display: grid;
  align-items: center;
  gap: 10px;
}

.dimension-card__header {
  grid-template-columns: 30px minmax(160px, 1fr) minmax(160px, 1fr) 110px auto;
}

.dimension-card__index,
.score-item-row__index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgb(var(--em-primary-color-rgb) / 0.12);
  color: var(--em-primary-color);
  font-weight: 700;
}

.dimension-card__index {
  width: 28px;
  height: 28px;
}

.score-item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 12px 0 8px;
  color: var(--n-text-color-2);
  font-size: 13px;
}

.score-item-row {
  width: 100%;
  grid-template-columns: 26px minmax(140px, 1fr) minmax(180px, 1.5fr) 110px 100px;
}

.score-item-row__index {
  width: 24px;
  height: 24px;
  font-size: 12px;
}
</style>
