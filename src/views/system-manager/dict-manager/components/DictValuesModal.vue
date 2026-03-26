<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { FormInst, FormRules } from 'naive-ui';
import { NButton, NForm, NFormItem, NInput, NModal, NSelect, NSpace } from 'naive-ui';
import { type DictValuesVo, fetchDictValuesAdd, fetchDictValuesUpdate } from '@/service/api';

interface Props {
  show: boolean;
  dictKey: string;
  data: DictValuesVo | null;
}

const props = defineProps<Props>();

const isEdit = computed(() => {
  const id = props.data?.id;
  return id !== undefined && id !== null;
});

const emit = defineEmits<{
  close: [];
}>();

const formRef = ref<FormInst | null>(null);
const submitting = ref(false);

const formData = ref({
  label: '',
  value: '',
  sort: 1 as number,
  status: 1 as number
});

const rules: FormRules = {
  label: [{ required: true, message: '请输入标签' }],
  value: [{ required: true, message: '请输入值' }]
};

const statusOptions = [
  { label: '启用', value: 1 },
  { label: '禁用', value: 0 }
];

watch(
  () => props.show,
  val => {
    if (val) {
      initFormData();
    }
  }
);

function initFormData() {
  if (isEdit.value && props.data) {
    formData.value = {
      label: props.data.label || '',
      value: props.data.value || '',
      sort: props.data.sort || 1,
      status: props.data.status || 1
    };
  } else {
    formData.value = {
      label: '',
      value: '',
      sort: 1,
      status: 1
    };
  }
}

function handleClose() {
  emit('close');
}

async function handleSubmit() {
  if (!props.dictKey) {
    window.$message?.warning('字典信息不完整');
    return;
  }

  try {
    await formRef.value?.validate();
  } catch {
    return;
  }

  submitting.value = true;
  try {
    const submitData: DictValuesVo = {
      dictKey: props.dictKey,
      label: formData.value.label,
      value: formData.value.value,
      sort: formData.value.sort,
      status: formData.value.status
    };

    if (isEdit.value && props.data?.id) {
      submitData.id = props.data.id;
      await fetchDictValuesUpdate(submitData);
      window.$message?.success('更新成功');
    } else {
      await fetchDictValuesAdd(submitData);
      window.$message?.success('新增成功');
    }
    emit('close');
  } catch (error) {
    console.error('提交失败:', error);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <NModal
    :show="props.show"
    preset="card"
    :title="isEdit ? '编辑字典值' : '新增字典值'"
    :style="{ width: '500px' }"
    :mask-closable="false"
    @update:show="(val: boolean) => !val && emit('close')"
  >
    <NForm ref="formRef" label-placement="left" :model="formData" :rules="rules" :label-width="80">
      <NFormItem label="标签" path="label">
        <NInput v-model:value="formData.label" placeholder="请输入标签" />
      </NFormItem>
      <NFormItem label="值" path="value">
        <NInput v-model:value="formData.value" placeholder="请输入值" />
      </NFormItem>
      <NFormItem label="排序">
        <NInputNumber v-model:value="formData.sort" placeholder="请输入排序" style="width: 100%" />
      </NFormItem>
      <NFormItem label="状态">
        <NSelect v-model:value="formData.status" placeholder="请选择状态" :options="statusOptions" />
      </NFormItem>
    </NForm>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="handleClose">取消</NButton>
        <NButton type="primary" :loading="submitting" @click="handleSubmit">确定</NButton>
      </NSpace>
    </template>
  </NModal>
</template>
