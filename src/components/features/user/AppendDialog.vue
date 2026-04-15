<script setup lang="ts">
import { AddCircle } from '@vicons/ionicons5';
import { NButton, NFlex, NForm, NFormItem, NGrid, NGi, NIcon, NInput, NModal, NSelect } from 'naive-ui';
import type { FormInst, FormRules } from 'naive-ui';

interface Props {
  show: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{ close: [] }>();

const formRef = ref<FormInst | null>(null);
const uploadFileRef = ref<HTMLInputElement | null>(null);

const formData = ref({
  account: '',
  username: '',
  password: '',
  deptName: '',
  avatar: '',
  jobStatus: '1',
  workStatus: '1',
  accountStatus: '1'
});

const rules: FormRules = {
  account: [{ required: true, message: '请输入账户', trigger: ['input', 'blur'] }],
  username: [{ required: true, message: '请输入用户名', trigger: ['input', 'blur'] }],
  password: [{ required: true, message: '请输入密码', trigger: ['input', 'blur'] }]
};

function handleClose() {
  emit('close');
}

function handleSubmit() {
  formRef.value?.validate().then(() => {
    window.$message?.success('演示页面暂未接入真实用户接口');
    emit('close');
  });
}

function handleUpload() {
  uploadFileRef.value?.click();
}
</script>

<template>
  <NModal :show="props.show" preset="card" title="新增用户" :style="{ width: '720px' }" @update:show="value => !value && emit('close')">
    <NForm ref="formRef" :model="formData" :rules="rules" label-placement="left" :label-width="88">
      <NGrid :cols="20" x-gap="20">
        <NGi span="15">
          <NFormItem label="账户" path="account">
            <NInput v-model:value="formData.account" placeholder="请输入账户" />
          </NFormItem>
          <NFormItem label="用户名" path="username">
            <NInput v-model:value="formData.username" placeholder="请输入用户名" />
          </NFormItem>
          <NFormItem label="密码" path="password">
            <NInput v-model:value="formData.password" type="password" show-password-on="click" placeholder="请输入密码" />
          </NFormItem>
        </NGi>
        <NGi span="5">
          <NFlex justify="center" align="center" class="h-full">
            <div class="avatar-box" @click="handleUpload">
              <NIcon size="72" color="rgb(var(--muted-text-color))"><AddCircle /></NIcon>
            </div>
            <input ref="uploadFileRef" hidden type="file" />
          </NFlex>
        </NGi>
      </NGrid>

      <NFormItem label="部门">
        <NInput v-model:value="formData.deptName" placeholder="请输入部门名称" />
      </NFormItem>

      <NFormItem label="岗位状态">
        <NSelect
          v-model:value="formData.jobStatus"
          :options="[
            { label: '在职', value: '1' },
            { label: '离职', value: '2' }
          ]"
        />
      </NFormItem>

      <NFormItem label="工作状态">
        <NSelect
          v-model:value="formData.workStatus"
          :options="[
            { label: '工作中', value: '1' },
            { label: '请假中', value: '2' }
          ]"
        />
      </NFormItem>

      <NFormItem label="账户状态">
        <NSelect
          v-model:value="formData.accountStatus"
          :options="[
            { label: '启用', value: '1' },
            { label: '禁用', value: '0' }
          ]"
        />
      </NFormItem>
    </NForm>

    <template #footer>
      <div class="flex justify-end gap-12px">
        <NButton @click="handleClose">取消</NButton>
        <NButton type="primary" @click="handleSubmit">提交</NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
.avatar-box {
  display: flex;
  height: 144px;
  width: 132px;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: rgb(var(--layout-bg-color));
  transition: all 0.2s ease;
}

.avatar-box:hover {
  background: rgb(var(--em-primary-color-rgb) / 10%);
}
</style>
