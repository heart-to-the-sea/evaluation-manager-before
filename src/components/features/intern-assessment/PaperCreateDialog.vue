<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NButton, NForm, NFormItem, NModal, NSelect, NSpin } from 'naive-ui';
import type { FormInst, FormRules, SelectOption } from 'naive-ui';
import { fetchAssessmentPaperCreate, fetchAssessmentPathList, fetchAssessmentPathById } from '@/service/api';
import type { AssessmentPaperCreateBo, AssessmentInternPathVo, UserOptionVo } from '@/types/app';

interface Props {
  show: boolean;
  userOptions: UserOptionVo[];
  defaultUserId?: string | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [submitted?: boolean];
}>();

const formRef = ref<FormInst | null>(null);
const loading = ref(false);
const paths = ref<AssessmentInternPathVo[]>([]);
const stageOptions = ref<SelectOption[]>([]);

const formData = ref<AssessmentPaperCreateBo>({
  userId: undefined,
  pathId: undefined,
  pathStageId: undefined
});

const rules: FormRules = {
  userId: [{ required: true, message: '请选择实习生', trigger: ['change'] }],
  pathId: [{ required: true, message: '请选择考核路径', trigger: ['change'] }],
  pathStageId: [{ required: true, message: '请选择考核阶段', trigger: ['change'] }]
};

const userOptions = computed<SelectOption[]>(() =>
  props.userOptions.map(item => ({
    label: `${item.name || '-'}${item.employeeNo ? `（${item.employeeNo}）` : ''}`,
    value: item.id || ''
  }))
);

const pathOptions = computed<SelectOption[]>(() =>
  paths.value.map(item => ({
    label: `${item.templateName || '未命名模板'} / ${item.currentStageName || '未开始'}`,
    value: item.id || ''
  }))
);

watch(
  () => props.show,
  async visible => {
    if (!visible) {
      return;
    }

    formData.value = {
      userId: props.defaultUserId || undefined,
      pathId: undefined,
      pathStageId: undefined
    };
    stageOptions.value = [];
    formRef.value?.restoreValidation();

    if (props.defaultUserId) {
      await loadPaths(props.defaultUserId);
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

async function handleUserChange(value: string | null) {
  formData.value.userId = value || undefined;
  formData.value.pathId = undefined;
  formData.value.pathStageId = undefined;
  stageOptions.value = [];

  if (value) {
    await loadPaths(value);
  }
}

async function handlePathChange(value: string | null) {
  formData.value.pathId = value || undefined;
  formData.value.pathStageId = undefined;
  stageOptions.value = [];

  if (!value) {
    return;
  }

  const { data, error } = await fetchAssessmentPathById(value);
  if (error || !data) {
    return;
  }

  stageOptions.value = (data.stages || []).map(item => ({
    label: `${item.stageName || '-'} / ${item.status || '-'}`,
    value: item.id || ''
  }));
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

  loading.value = true;
  try {
    const { error } = await fetchAssessmentPaperCreate(formData.value);
    if (error) {
      return;
    }

    window.$message?.success('试卷生成成功');
    emit('close', true);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    title="生成考核试卷"
    :style="{ width: '640px' }"
    :mask-closable="false"
    @update:show="value => !value && handleClose()"
  >
    <NSpin :show="loading">
      <NForm ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="88">
        <NFormItem label="实习生" path="userId">
          <NSelect v-model:value="formData.userId" :options="userOptions" filterable placeholder="请选择实习生" @update:value="handleUserChange" />
        </NFormItem>
        <NFormItem label="考核路径" path="pathId">
          <NSelect v-model:value="formData.pathId" :options="pathOptions" placeholder="请选择考核路径" @update:value="handlePathChange" />
        </NFormItem>
        <NFormItem label="考核阶段" path="pathStageId">
          <NSelect v-model:value="formData.pathStageId" :options="stageOptions" placeholder="请选择考核阶段" />
        </NFormItem>
      </NForm>
    </NSpin>

    <template #action>
      <div class="flex justify-end gap-12px">
        <NButton @click="handleClose">取消</NButton>
        <NButton type="primary" @click="handleSubmit">生成试卷</NButton>
      </div>
    </template>
  </NModal>
</template>
