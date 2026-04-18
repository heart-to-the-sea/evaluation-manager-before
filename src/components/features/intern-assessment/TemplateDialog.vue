<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NButton, NDynamicInput, NForm, NFormItem, NGrid, NGi, NInput, NInputNumber, NModal, NSelect, NSpin, NTag } from 'naive-ui';
import type { FormInst, FormRules, SelectOption } from 'naive-ui';
import DictSelect from '@/components/common/DictSelect.vue';
import { fetchAssessmentTemplateAdd, fetchAssessmentTemplateUpdate } from '@/service/api';
import type { AssessmentPathTemplateBo, AssessmentPathTemplateVo, AssessmentStageVo } from '@/types/app';

const TEXT = {
  enabled: '\u542f\u7528',
  disabled: '\u7981\u7528',
  templateName: '\u6a21\u677f\u540d\u79f0',
  templateDescription: '\u6a21\u677f\u8bf4\u660e',
  templateStatus: '\u72b6\u6001',
  templateStages: '\u6a21\u677f\u9636\u6bb5',
  addStage: '\u65b0\u589e\u9636\u6bb5',
  chooseStage: '\u8bf7\u9009\u62e9\u9636\u6bb5',
  sort: '\u6392\u5e8f',
  cancel: '\u53d6\u6d88',
  save: '\u4fdd\u5b58',
  addTitle: '\u65b0\u589e\u8003\u6838\u6a21\u677f',
  editTitle: '\u7f16\u8f91\u8003\u6838\u6a21\u677f',
  requiredName: '\u8bf7\u8f93\u5165\u6a21\u677f\u540d\u79f0',
  requiredStatus: '\u8bf7\u9009\u62e9\u72b6\u6001',
  saveAddSuccess: '\u8003\u6838\u6a21\u677f\u65b0\u589e\u6210\u529f',
  saveEditSuccess: '\u8003\u6838\u6a21\u677f\u66f4\u65b0\u6210\u529f',
  stageCode: '\u9636\u6bb5\u7f16\u7801',
  stageDescription: '\u9636\u6bb5\u8bf4\u660e',
  passScore: '\u901a\u8fc7\u5206\u6570',
  passRemark: '\u901a\u8fc7\u6807\u51c6',
  materials: '\u9700\u8981\u5b8c\u6210\u7684\u4e8b\u9879',
  rules: '\u8003\u6838\u6307\u6807',
  noDescription: '\u6682\u65e0\u8bf4\u660e',
  noMaterials: '\u6682\u672a\u914d\u7f6e',
  noRules: '\u6682\u672a\u914d\u7f6e',
  materialCount: '\u9879\u4efb\u52a1',
  ruleCount: '\u9879\u6307\u6807'
} as const;

interface Props {
  show: boolean;
  data?: AssessmentPathTemplateVo | null;
  stageList: AssessmentStageVo[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [submitted?: boolean];
}>();

const formRef = ref<FormInst | null>(null);
const submitting = ref(false);
const isEdit = computed(() => Boolean(props.data?.id));

const stageOptions = computed<SelectOption[]>(() =>
  props.stageList.map(item => ({
    label: `${item.name || '-'}${item.code ? `（${item.code}）` : ''}`,
    value: item.id || ''
  }))
);

const stageDetailMap = computed(() => {
  const map = new Map<string, AssessmentStageVo>();
  props.stageList.forEach(item => {
    if (item.id) {
      map.set(item.id, item);
    }
  });
  return map;
});

const formData = ref<AssessmentPathTemplateBo>(createDefaultForm());

const rules: FormRules = {
  name: [{ required: true, message: TEXT.requiredName, trigger: ['input', 'blur'] }],
  status: [{ required: true, message: TEXT.requiredStatus, trigger: ['change'] }]
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

function createDefaultForm(): AssessmentPathTemplateBo {
  return {
    name: '',
    description: '',
    status: '1',
    stages: []
  };
}

function createFormData(data?: AssessmentPathTemplateVo | null): AssessmentPathTemplateBo {
  if (!data) {
    return createDefaultForm();
  }

  return {
    id: data.id,
    name: data.name || '',
    description: data.description || '',
    status: data.status || '1',
    stages: (data.stages || []).map(item => ({
      id: item.id,
      stageId: item.stageId,
      sort: item.sort ?? 0
    }))
  };
}

function createStageItem() {
  return {
    stageId: undefined,
    sort: (formData.value.stages?.length || 0) + 1
  };
}

function getStageDetail(stageId?: string) {
  if (!stageId) return null;
  return stageDetailMap.value.get(stageId) || null;
}

function buildRuleText(rule: NonNullable<AssessmentStageVo['rules']>[number]) {
  const parts = [rule.questionType, rule.difficulty, rule.knowledgePoints].filter(Boolean);
  const questionCount = rule.questionCount ? `${rule.questionCount}\u9898` : '';
  const score = rule.score !== null && rule.score !== undefined && rule.score !== '' ? `${rule.score}\u5206` : '';
  return [parts.join(' / '), questionCount, score].filter(Boolean).join(' \u00b7 ');
}

function handleAddStage() {
  formData.value.stages = [...(formData.value.stages || []), createStageItem()];
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
    const payload: AssessmentPathTemplateBo = {
      ...formData.value,
      name: formData.value.name?.trim(),
      description: formData.value.description?.trim() || undefined,
      stages: (formData.value.stages || [])
        .filter(item => item.stageId)
        .map((item, index) => ({
          ...item,
          sort: item.sort ?? index + 1
        }))
    };

    const { error } = isEdit.value ? await fetchAssessmentTemplateUpdate(payload) : await fetchAssessmentTemplateAdd(payload);
    if (error) {
      return;
    }

    window.$message?.success(isEdit.value ? TEXT.saveEditSuccess : TEXT.saveAddSuccess);
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
    :title="isEdit ? TEXT.editTitle : TEXT.addTitle"
    :style="{ width: '960px' }"
    :mask-closable="false"
    @update:show="value => !value && handleClose()"
  >
    <NSpin :show="submitting">
      <NForm ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="88">
        <NGrid :cols="2" :x-gap="16">
          <NGi>
            <NFormItem :label="TEXT.templateName" path="name">
              <NInput v-model:value="formData.name" :placeholder="TEXT.requiredName" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem :label="TEXT.templateStatus" path="status">
              <DictSelect v-model:model-value="formData.status" dict-code="assessment_enable_status" :placeholder="TEXT.requiredStatus" />
            </NFormItem>
          </NGi>
          <NGi span="2">
            <NFormItem :label="TEXT.templateDescription" path="description">
              <NInput v-model:value="formData.description" type="textarea" :rows="3" :placeholder="TEXT.templateDescription" />
            </NFormItem>
          </NGi>
        </NGrid>

        <div class="mb-12px mt-12px flex items-center justify-between">
          <div class="text-16px font-600">{{ TEXT.templateStages }}</div>
          <NButton text type="primary" @click="handleAddStage">{{ TEXT.addStage }}</NButton>
        </div>

        <NDynamicInput v-model:value="formData.stages" :min="0" :on-create="createStageItem">
          <template #default="{ value }">
            <div class="template-stage-item mb-12px w-full rounded-8px border border-solid border-[var(--n-border-color)] p-12px">
              <NGrid :cols="24" :x-gap="12" class="w-full">
                <NGi span="18">
                  <NSelect v-model:value="value.stageId" :options="stageOptions" :placeholder="TEXT.chooseStage" />
                </NGi>
                <NGi span="6">
                  <NInputNumber v-model:value="value.sort" :min="0" style="width: 100%" :placeholder="TEXT.sort" />
                </NGi>
              </NGrid>

              <div v-if="getStageDetail(value.stageId)" class="stage-preview mt-12px rounded-8px bg-[var(--table-header-color)] px-12px py-10px">
                <div class="mb-8px flex items-center gap-8px">
                  <div class="text-15px font-600">{{ getStageDetail(value.stageId)?.name || '-' }}</div>
                  <NTag size="small" type="info" :bordered="false">{{ getStageDetail(value.stageId)?.code || '-' }}</NTag>
                  <NTag size="small" type="success" :bordered="false">
                    {{ `${TEXT.materials}：${getStageDetail(value.stageId)?.materials?.length || 0}${TEXT.materialCount}` }}
                  </NTag>
                  <NTag size="small" type="warning" :bordered="false">
                    {{ `${TEXT.rules}：${getStageDetail(value.stageId)?.rules?.length || 0}${TEXT.ruleCount}` }}
                  </NTag>
                </div>

                <div class="stage-preview__row">
                  <span class="stage-preview__label">{{ TEXT.stageDescription }}：</span>
                  <span>{{ getStageDetail(value.stageId)?.description || TEXT.noDescription }}</span>
                </div>
                <div class="stage-preview__row">
                  <span class="stage-preview__label">{{ TEXT.passScore }}：</span>
                  <span>{{ getStageDetail(value.stageId)?.passScore ?? '-' }}</span>
                  <span class="ml-16px stage-preview__label">{{ TEXT.passRemark }}：</span>
                  <span>{{ getStageDetail(value.stageId)?.passRemark || '-' }}</span>
                </div>
                <div class="stage-preview__row">
                  <span class="stage-preview__label">{{ TEXT.materials }}：</span>
                  <span>{{ getStageDetail(value.stageId)?.materials?.map(item => item.title || item.materialUrl).filter(Boolean).join('；') || TEXT.noMaterials }}</span>
                </div>
                <div class="stage-preview__row">
                  <span class="stage-preview__label">{{ TEXT.rules }}：</span>
                  <span>{{ getStageDetail(value.stageId)?.rules?.map(item => buildRuleText(item)).filter(Boolean).join('；') || TEXT.noRules }}</span>
                </div>
              </div>
            </div>
          </template>
        </NDynamicInput>
      </NForm>
    </NSpin>

    <template #action>
      <div class="em-dialog-actions">
        <NButton @click="handleClose">{{ TEXT.cancel }}</NButton>
        <NButton type="primary" @click="handleSubmit">{{ TEXT.save }}</NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped lang="scss">
.stage-preview__row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 6px;
  line-height: 1.7;

  &:last-child {
    margin-bottom: 0;
  }
}

.stage-preview__label {
  flex-shrink: 0;
  color: var(--n-text-color-2);
}
</style>
