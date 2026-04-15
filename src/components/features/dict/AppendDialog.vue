<script setup lang="ts">
import { NButton, NForm, NFormItem, NInput, NModal, NSelect, NSpace } from 'naive-ui';
import type { FormInst, FormRules } from 'naive-ui';
import type { DictVo } from '@/types/app';
import { fetchDictAdd, fetchDictUpdate } from '@/service/api';

interface Props {
  show: boolean;
  data: DictVo | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{ close: [] }>();

const formRef = ref<FormInst | null>(null);
const submitting = ref(false);
const isEdit = computed(() => Boolean(props.data?.id));

const formData = ref({
  name: '',
  code: '',
  description: '',
  status: 1,
  dictTemplateStr: ''
});

const rules: FormRules = {
  name: [{ required: true, message: '请输入字典名称', trigger: ['input', 'blur'] }],
  code: [{ required: true, message: '请输入字典编码', trigger: ['input', 'blur'] }]
};

const statusOptions = [
  { label: '启用', value: 1 },
  { label: '禁用', value: 0 }
];

watch(
  () => props.show,
  visible => {
    if (!visible) {
      return;
    }

    formData.value = {
      name: props.data?.name || '',
      code: props.data?.code || '',
      description: props.data?.description || '',
      status: props.data?.status ?? 1,
      dictTemplateStr: props.data?.dictTemplateStr || ''
    };
  }
);

function handleClose() {
  emit('close');
}

async function handleSubmit() {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }

  submitting.value = true;

  try {
    const payload: DictVo = {
      ...formData.value,
      id: props.data?.id
    };

    if (isEdit.value) {
      await fetchDictUpdate(payload);
      window.$message?.success('字典更新成功');
    } else {
      await fetchDictAdd(payload);
      window.$message?.success('字典新增成功');
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
    :title="isEdit ? '编辑字典' : '新增字典'"
    :style="{ width: '620px' }"
    :mask-closable="false"
    @update:show="value => !value && emit('close')"
  >
    <NForm ref="formRef" :model="formData" :rules="rules" label-placement="left" :label-width="88">
      <NFormItem label="字典名称" path="name">
        <NInput v-model:value="formData.name" placeholder="请输入字典名称" />
      </NFormItem>

      <NFormItem label="字典编码" path="code">
        <NInput v-model:value="formData.code" :disabled="isEdit" placeholder="请输入字典编码" />
      </NFormItem>

      <NFormItem label="状态" path="status">
        <NSelect v-model:value="formData.status" :options="statusOptions" placeholder="请选择状态" />
      </NFormItem>

      <NFormItem label="描述">
        <NInput v-model:value="formData.description" type="textarea" placeholder="请输入描述" />
      </NFormItem>

      <NFormItem v-if="!isEdit" label="字典模板">
        <NInput
          v-model:value="formData.dictTemplateStr"
          type="textarea"
          :autosize="{ minRows: 8, maxRows: 12 }"
          placeholder="每行一个值，格式：标签 值"
        />
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
