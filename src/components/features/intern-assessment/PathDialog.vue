<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NButton, NDynamicInput, NForm, NFormItem, NGrid, NGi, NInputNumber, NModal, NSelect, NSpin } from 'naive-ui';
import type { FormInst, FormRules, SelectOption } from 'naive-ui';
import DictSelect from '@/components/common/DictSelect.vue';
import { fetchAssessmentPathAdd, fetchAssessmentPathUpdate, fetchAssessmentTemplateById } from '@/service/api';
import type { AssessmentInternPathBo, AssessmentInternPathVo, UserOptionVo } from '@/types/app';

interface Props {
  show: boolean;
  data?: AssessmentInternPathVo | null;
  userOptions: UserOptionVo[];
  templateOptions: SelectOption[];
  stageOptions: SelectOption[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [submitted?: boolean];
}>();

const formRef = ref<FormInst | null>(null);
const submitting = ref(false);
const templateLoading = ref(false);
const isEdit = computed(() => Boolean(props.data?.id));

const userSelectOptions = computed<SelectOption[]>(() =>
  props.userOptions.map(item => ({
    label: `${item.name || '-'}${item.employeeNo ? `（${item.employeeNo}）` : ''}`,
    value: item.id || ''
  }))
);

const formData = ref<AssessmentInternPathBo>(createDefaultForm());

const rules: FormRules = {
  userId: [{ required: true, message: '请选择实习生', trigger: ['change'] }],
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
    if (visible) {
      formData.value = createFormData(props.data);
      formRef.value?.restoreValidation();
    }
  }
);

function createDefaultForm(): AssessmentInternPathBo {
  return {
    userId: undefined,
    templateId: undefined,
    status: 'not_started',
    stages: []
  };
}

function createFormData(data?: AssessmentInternPathVo | null): AssessmentInternPathBo {
  if (!data) {
    return createDefaultForm();
  }

  return {
    id: data.id,
    userId: data.userId,
    templateId: data.templateId,
    status: data.status || 'not_started',
    stages: (data.stages || []).map(item => ({
      id: item.id,
      stageId: item.stageId,
      stageName: item.stageName,
      sort: item.sort ?? 0,
      sourceType: item.sourceType || 'template',
      status: item.status || 'pending'
    }))
  };
}

function createStageItem() {
  return {
    stageId: undefined,
    sort: (formData.value.stages?.length || 0) + 1,
    sourceType: 'manual',
    status: 'pending'
  };
}

function handleAddStage() {
  formData.value.stages = [...(formData.value.stages || []), createStageItem()];
}

async function handleTemplateChange(value: string | null) {
  formData.value.templateId = value || undefined;
  if (!value) {
    return;
  }

  templateLoading.value = true;
  try {
    const { data, error } = await fetchAssessmentTemplateById(value);
    if (error || !data) {
      return;
    }

    formData.value.stages = (data.stages || []).map((item, index) => ({
      stageId: item.stageId,
      stageName: item.stageNameSnapshot,
      sort: item.sort ?? index + 1,
      sourceType: 'template',
      status: 'pending'
    }));
  } finally {
    templateLoading.value = false;
  }
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
    const payload: AssessmentInternPathBo = {
      ...formData.value,
      stages: (formData.value.stages || [])
        .filter(item => item.stageId)
        .map((item, index) => ({
          ...item,
          sort: item.sort ?? index + 1,
          sourceType: item.sourceType || 'manual',
          status: item.status || 'pending'
        }))
    };

    const { error } = isEdit.value ? await fetchAssessmentPathUpdate(payload) : await fetchAssessmentPathAdd(payload);
    if (error) {
      return;
    }

    window.$message?.success(isEdit.value ? '路径更新成功' : '路径新增成功');
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
    :title="isEdit ? '编辑考核路径' : '新增考核路径'"
    :style="{ width: '920px' }"
    :mask-closable="false"
    @update:show="value => !value && handleClose()"
  >
    <NSpin :show="submitting || templateLoading">
      <NForm ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="88">
        <NGrid :cols="2" :x-gap="16">
          <NGi>
            <NFormItem label="实习生" path="userId">
              <NSelect v-model:value="formData.userId" :options="userSelectOptions" filterable placeholder="请选择实习生" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="路径模板" path="templateId">
              <NSelect v-model:value="formData.templateId" :options="templateOptions" clearable placeholder="选择模板后自动带出阶段" @update:value="handleTemplateChange" />
            </NFormItem>
          </NGi>
          <NGi span="2">
            <NFormItem label="路径状态" path="status">
              <DictSelect v-model:model-value="formData.status" dict-code="assessment_path_status" placeholder="请选择路径状态" />
            </NFormItem>
          </NGi>
        </NGrid>

        <div class="mb-12px mt-12px flex items-center justify-between">
          <div class="text-16px font-600">阶段安排</div>
          <NButton text type="primary" @click="handleAddStage">新增阶段</NButton>
        </div>

        <NDynamicInput v-model:value="formData.stages" :min="0" :on-create="createStageItem">
          <template #default="{ value }">
            <NGrid :cols="24" :x-gap="12" class="mb-8px w-full">
              <NGi span="10">
                <NSelect v-model:value="value.stageId" :options="stageOptions" placeholder="请选择阶段" />
              </NGi>
              <NGi span="4">
                <NInputNumber v-model:value="value.sort" :min="0" style="width: 100%" placeholder="排序" />
              </NGi>
              <NGi span="5">
                <NSelect
                  v-model:value="value.sourceType"
                  :options="[
                    { label: '模板生成', value: 'template' },
                    { label: '手动配置', value: 'manual' }
                  ]"
                  placeholder="来源"
                />
              </NGi>
              <NGi span="5">
                <DictSelect v-model:model-value="value.status" dict-code="assessment_path_stage_status" placeholder="阶段状态" />
              </NGi>
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
