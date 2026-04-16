<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { NButton, NDatePicker, NForm, NFormItem, NGrid, NGi, NInput, NModal, NSpin, NSwitch, NTreeSelect } from 'naive-ui';
import type { FormInst, FormRules, TreeSelectOption } from 'naive-ui';
import DictSelect from '@/components/common/DictSelect.vue';
import { fetchUserAdd, fetchUserUpdate } from '@/service/api';
import type { DepartmentVo, UserBo, UserVo } from '@/types/app';

interface Props {
  show: boolean;
  data?: UserVo | null;
  departmentTree: DepartmentVo[];
}

interface FormModel {
  id: string;
  employeeNo: string;
  name: string;
  gender: string | null;
  birthday: number | null;
  phone: string;
  email: string;
  avatar: string;
  departmentId: string | null;
  userType: string | null;
  positionName: string | null;
  leaderFlag: boolean;
  entryDate: number | null;
  jobStatus: string | null;
  workStatus: string | null;
  accountStatus: string | null;
  account: string;
  password: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [submitted?: boolean];
}>();

const formRef = ref<FormInst | null>(null);
const submitting = ref(false);
const formData = ref<FormModel>(createDefaultForm());
const isEdit = computed(() => Boolean(props.data?.id));

const rules = computed<FormRules>(() => ({
  employeeNo: [{ required: true, message: '请输入工号', trigger: ['input', 'blur'] }],
  name: [{ required: true, message: '请输入姓名', trigger: ['input', 'blur'] }],
  account: [{ required: true, message: '请输入登录账号', trigger: ['input', 'blur'] }],
  password: isEdit.value ? [] : [{ required: true, message: '请输入登录密码', trigger: ['input', 'blur'] }],
  departmentId: [{ required: true, message: '请选择所属部门', trigger: ['change', 'blur'] }],
  userType: [{ required: true, message: '请选择用户类型', trigger: ['change', 'blur'] }],
  positionName: [{ required: true, message: '请选择岗位名称', trigger: ['change', 'blur'] }],
  entryDate: [{ required: true, type: 'number', message: '请选择入职日期', trigger: ['change', 'blur'] }],
  jobStatus: [{ required: true, message: '请选择任职状态', trigger: ['change'] }],
  workStatus: [{ required: true, message: '请选择工作状态', trigger: ['change'] }],
  accountStatus: [{ required: true, message: '请选择账号状态', trigger: ['change'] }]
}));

const departmentOptions = computed<TreeSelectOption[]>(() => buildDepartmentOptions(props.departmentTree));

watch(
  () => props.show,
  visible => {
    if (visible) {
      formData.value = createFormData(props.data);
      nextTick(() => {
        formRef.value?.restoreValidation();
      });
    }
  }
);

function createDefaultForm(): FormModel {
  return {
    id: '',
    employeeNo: '',
    name: '',
    gender: null,
    birthday: null,
    phone: '',
    email: '',
    avatar: '',
    departmentId: null,
    userType: 'employee',
    positionName: null,
    leaderFlag: false,
    entryDate: null,
    jobStatus: '1',
    workStatus: '1',
    accountStatus: '1',
    account: '',
    password: ''
  };
}

function createFormData(data?: UserVo | null): FormModel {
  if (!data) {
    return createDefaultForm();
  }

  return {
    id: data.id || '',
    employeeNo: data.employeeNo || '',
    name: data.name || data.username || '',
    gender: data.gender || null,
    birthday: parseDateToTimestamp(data.birthday),
    phone: data.phone || '',
    email: data.email || '',
    avatar: data.avatar || '',
    departmentId: data.departmentId || null,
    userType: data.userType || 'employee',
    positionName: data.positionName || null,
    leaderFlag: Boolean(data.leaderFlag),
    entryDate: parseDateToTimestamp(data.entryDate),
    jobStatus: data.jobStatus || '1',
    workStatus: data.workStatus || '1',
    accountStatus: data.accountStatus || '1',
    account: data.account || '',
    password: ''
  };
}

function buildDepartmentOptions(list: DepartmentVo[]): TreeSelectOption[] {
  return (list || []).map(item => ({
    label: item.name || '未命名部门',
    value: item.id || '',
    children: item.children?.length ? buildDepartmentOptions(item.children) : undefined
  }));
}

function parseDateToTimestamp(value?: string | null) {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function formatDate(value?: number | null) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

  const payload: UserBo = {
    id: formData.value.id || undefined,
    employeeNo: formData.value.employeeNo.trim(),
    name: formData.value.name.trim(),
    gender: formData.value.gender || undefined,
    birthday: formatDate(formData.value.birthday),
    phone: formData.value.phone.trim() || undefined,
    email: formData.value.email.trim() || undefined,
    avatar: formData.value.avatar.trim() || undefined,
    departmentId: formData.value.departmentId || undefined,
    userType: formData.value.userType || undefined,
    positionName: formData.value.positionName || undefined,
    leaderFlag: formData.value.leaderFlag,
    entryDate: formatDate(formData.value.entryDate),
    jobStatus: formData.value.jobStatus || undefined,
    workStatus: formData.value.workStatus || undefined,
    accountStatus: formData.value.accountStatus || undefined,
    account: formData.value.account.trim(),
    password: formData.value.password.trim() || undefined
  };

  submitting.value = true;

  try {
    const response = isEdit.value ? await fetchUserUpdate(payload) : await fetchUserAdd(payload);
    if (response.error) {
      return;
    }

    window.$message?.success(isEdit.value ? '人员更新成功' : '人员新增成功');
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
    :title="isEdit ? '编辑人员' : '新增人员'"
    :style="{ width: '820px' }"
    :mask-closable="false"
    @update:show="value => !value && handleClose()"
  >
    <NSpin :show="submitting">
      <NForm ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="88">
        <NGrid :cols="2" :x-gap="16">
          <NGi>
            <NFormItem label="工号" path="employeeNo">
              <NInput v-model:value="formData.employeeNo" placeholder="请输入工号" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="姓名" path="name">
              <NInput v-model:value="formData.name" placeholder="请输入姓名" />
            </NFormItem>
          </NGi>

          <NGi>
            <NFormItem label="登录账号" path="account">
              <NInput v-model:value="formData.account" placeholder="请输入登录账号" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="登录密码" path="password">
              <NInput
                v-model:value="formData.password"
                type="password"
                show-password-on="click"
                :placeholder="isEdit ? '留空则保持原密码' : '请输入登录密码'"
              />
            </NFormItem>
          </NGi>

          <NGi>
            <NFormItem label="所属部门" path="departmentId">
              <NTreeSelect
                v-model:value="formData.departmentId"
                :options="departmentOptions"
                clearable
                filterable
                default-expand-all
                key-field="value"
                label-field="label"
                children-field="children"
                placeholder="请选择所属部门"
              />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="用户类型" path="userType">
              <DictSelect v-model:model-value="formData.userType" dict-code="user_type" placeholder="请选择用户类型" />
            </NFormItem>
          </NGi>

          <NGi>
            <NFormItem label="岗位名称" path="positionName">
              <DictSelect v-model:model-value="formData.positionName" dict-code="employee_position" clearable placeholder="请选择岗位名称" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="是否负责人" path="leaderFlag">
              <NSwitch v-model:value="formData.leaderFlag" />
            </NFormItem>
          </NGi>

          <NGi>
            <NFormItem label="性别" path="gender">
              <DictSelect v-model:model-value="formData.gender" dict-code="employee_gender" clearable placeholder="请选择性别" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="出生日期" path="birthday">
              <NDatePicker v-model:value="formData.birthday" type="date" clearable style="width: 100%" />
            </NFormItem>
          </NGi>

          <NGi>
            <NFormItem label="手机号" path="phone">
              <NInput v-model:value="formData.phone" placeholder="请输入手机号" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="邮箱" path="email">
              <NInput v-model:value="formData.email" placeholder="请输入邮箱" />
            </NFormItem>
          </NGi>

          <NGi>
            <NFormItem label="头像地址" path="avatar">
              <NInput v-model:value="formData.avatar" placeholder="请输入头像地址" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="入职日期" path="entryDate">
              <NDatePicker v-model:value="formData.entryDate" type="date" clearable style="width: 100%" />
            </NFormItem>
          </NGi>

          <NGi>
            <NFormItem label="任职状态" path="jobStatus">
              <DictSelect v-model:model-value="formData.jobStatus" dict-code="employee_job_status" placeholder="请选择任职状态" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="工作状态" path="workStatus">
              <DictSelect v-model:model-value="formData.workStatus" dict-code="employee_work_status" placeholder="请选择工作状态" />
            </NFormItem>
          </NGi>

          <NGi span="2">
            <NFormItem label="账号状态" path="accountStatus">
              <DictSelect v-model:model-value="formData.accountStatus" dict-code="employee_account_status" placeholder="请选择账号状态" />
            </NFormItem>
          </NGi>
        </NGrid>
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
