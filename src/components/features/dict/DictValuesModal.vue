<script setup lang="ts">
import { NButton, NForm, NFormItem, NInput, NInputNumber, NModal, NSelect, NSpace } from 'naive-ui';
import type { FormInst, FormRules } from 'naive-ui';
import type { DictValuesVo } from '@/types/app';
import { fetchDictValuesAdd, fetchDictValuesUpdate } from '@/service/api';

interface Props {
  show: boolean;
  dictCode: string;
  data: DictValuesVo | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{ close: [] }>();

const formRef = ref<FormInst | null>(null);
const submitting = ref(false);
const isEdit = computed(() => Boolean(props.data?.id));

const formData = ref({
  label: '',
  value: '',
  sort: 1,
  status: '1'
});

const rules: FormRules = {
  label: [{ required: true, message: '请输入标签', trigger: ['input', 'blur'] }],
  value: [{ required: true, message: '请输入值', trigger: ['input', 'blur'] }]
};

const statusOptions = [
  { label: '启用', value: '1' },
  { label: '禁用', value: '0' }
];

watch(
  () => props.show,
  visible => {
    if (!visible) {
      return;
    }

    formData.value = {
      label: props.data?.label || '',
      value: props.data?.value || '',
      sort: props.data?.sort ?? 1,
      status: props.data?.status || '1'
    };
  }
);

async function handleSubmit() {
  if (!props.dictCode) {
    window.$message?.warning('缺少字典编码');
    return;
  }

  try {
    await formRef.value?.validate();
  } catch {
    return;
  }

  submitting.value = true;

  try {
    const payload: DictValuesVo = {
      id: props.data?.id,
      dictCode: props.dictCode,
      label: formData.value.label,
      value: formData.value.value,
      sort: formData.value.sort,
      status: formData.value.status
    };

    if (isEdit.value) {
      await fetchDictValuesUpdate(payload);
      window.$message?.success('字典值更新成功');
    } else {
      await fetchDictValuesAdd(payload);
      window.$message?.success('字典值新增成功');
    }

    emit('close');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    :title="isEdit ? '编辑字典值' : '新增字典值'"
    :style="{ width: '520px' }"
    :mask-closable="false"
    @update:show="value => !value && emit('close')"
  >
    <NForm ref="formRef" :model="formData" :rules="rules" label-placement="left" :label-width="72">
      <NFormItem label="标签" path="label">
        <NInput v-model:value="formData.label" placeholder="请输入标签" />
      </NFormItem>
      <NFormItem label="值" path="value">
        <NInput v-model:value="formData.value" placeholder="请输入值" />
      </NFormItem>
      <NFormItem label="排序">
        <NInputNumber v-model:value="formData.sort" class="w-full" :min="0" />
      </NFormItem>
      <NFormItem label="状态">
        <NSelect v-model:value="formData.status" :options="statusOptions" placeholder="请选择状态" />
      </NFormItem>
    </NForm>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="emit('close')">取消</NButton>
        <NButton type="primary" :loading="submitting" @click="handleSubmit">确定</NButton>
      </NSpace>
    </template>
  </NModal>
</template>
