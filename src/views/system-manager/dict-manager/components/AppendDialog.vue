<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { FormInst, FormRules } from 'naive-ui';
import { NButton, NForm, NFormItem, NInput, NModal, NSelect, NSpace } from 'naive-ui';
import { type DictVo, fetchDictAdd, fetchDictUpdate } from '@/service/api';

interface Props {
  show: boolean;
  data: DictVo | null;
}

const props = defineProps<Props>();

const isEdit = computed(() => Boolean(props.data?.id && props.data.id !== ''));

const emit = defineEmits<{
  close: [];
}>();

const formRef = ref<FormInst | null>(null);
const submitting = ref(false);

const formData = ref({
  name: '',
  code: '',
  description: '',
  status: 1 as number,
  dictTemplateStr: ''
});

const rules: FormRules = {
  name: [
    {
      required: true,
      message: '请输入字典名称'
    }
  ],
  code: [
    {
      required: true,
      message: '请输入字典编码'
    }
  ]
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
      name: props.data.name || '',
      code: props.data.code || '',
      description: props.data.description || '',
      status: props.data.status || 1,
      dictTemplateStr: props.data.dictTemplateStr || ''
    };
  } else {
    formData.value = {
      name: '',
      code: '',
      description: '',
      status: 1,
      dictTemplateStr: ''
    };
  }
}

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
    const dictData: DictVo = {
      name: formData.value.name,
      code: formData.value.code,
      description: formData.value.description,
      status: formData.value.status,
      dictTemplateStr: formData.value.dictTemplateStr
    };

    if (isEdit.value && props.data?.id) {
      dictData.id = props.data.id;
      await fetchDictUpdate(dictData);
      window.$message?.success('更新成功');
    } else {
      await fetchDictAdd(dictData);
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
    :title="isEdit ? '编辑字典' : '新增字典'"
    :style="{ width: '600px' }"
    :mask-closable="false"
    @update:show="(val: boolean) => !val && emit('close')"
  >
    <NForm ref="formRef" label-placement="left" :model="formData" :rules="rules" :label-width="80">
      <NFormItem label="字典名称" path="name">
        <NInput v-model:value="formData.name" placeholder="请输入字典名称" />
      </NFormItem>
      <NFormItem label="字典编码" path="code">
        <NInput v-model:value="formData.code" placeholder="请输入字典编码" :disabled="isEdit" />
      </NFormItem>
      <NFormItem label="描述">
        <NInput v-model:value="formData.description" type="textarea" placeholder="请输入描述" />
      </NFormItem>
      <NFormItem label="状态">
        <NSelect v-model:value="formData.status" placeholder="请选择状态" :options="statusOptions" />
      </NFormItem>
      <NFormItem label="字典模板">
        <NInput
          v-model:value="formData.dictTemplateStr"
          type="textarea"
          placeholder="请输入字典值模板，每行一个，格式：label value"
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
