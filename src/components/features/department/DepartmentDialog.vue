<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { NButton, NForm, NFormItem, NInput, NInputNumber, NModal, NSelect, NSpace, NTreeSelect } from 'naive-ui';
import type { FormInst, FormRules, SelectOption, TreeSelectOption } from 'naive-ui';
import DictSelect from '@/components/common/DictSelect.vue';
import { fetchDepartmentAdd, fetchDepartmentUpdate, fetchUserOptions } from '@/service/api';
import type { DepartmentBo, DepartmentVo, UserOptionVo } from '@/types/app';

interface Props {
  show: boolean;
  data?: DepartmentVo | null;
  departmentTree: DepartmentVo[];
}

interface FormModel {
  id: string;
  parentId: string;
  name: string;
  leaderEmployeeId: string | null;
  sort: number;
  status: string | null;
  remark: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [submitted?: boolean];
}>();

const formRef = ref<FormInst | null>(null);
const submitting = ref(false);
const leaderLoading = ref(false);
const leaderOptions = ref<SelectOption[]>([]);

const isEdit = computed(() => Boolean(props.data?.id));
const formData = ref<FormModel>(createDefaultForm());

const rules: FormRules = {
  name: [{ required: true, message: '请输入部门名称', trigger: ['input', 'blur'] }],
  status: [{ required: true, message: '请选择部门状态', trigger: ['change'] }]
};

const excludedIds = computed(() => {
  const ids = new Set<string>();
  const currentId = props.data?.id;

  if (!currentId) {
    return ids;
  }

  collectDescendantIds(props.departmentTree, currentId, ids);
  return ids;
});

const parentOptions = computed<TreeSelectOption[]>(() => [
  {
    label: '顶级部门',
    value: '0',
    children: buildParentOptions(props.departmentTree, excludedIds.value)
  }
]);

watch(
  () => props.show,
  visible => {
    if (visible) {
      formData.value = createFormData(props.data);
      loadLeaderOptions();
      nextTick(() => {
        formRef.value?.restoreValidation();
      });
    }
  }
);

function createDefaultForm(): FormModel {
  return {
    id: '',
    parentId: '0',
    name: '',
    leaderEmployeeId: null,
    sort: 0,
    status: '1',
    remark: ''
  };
}

function createFormData(data?: DepartmentVo | null): FormModel {
  if (!data) {
    return createDefaultForm();
  }

  return {
    id: data.id || '',
    parentId: data.parentId || '0',
    name: data.name || '',
    leaderEmployeeId: data.leaderEmployeeId || null,
    sort: data.sort ?? 0,
    status: data.status || '1',
    remark: data.remark || ''
  };
}

function collectDescendantIds(list: DepartmentVo[], targetId: string, result: Set<string>) {
  for (const item of list) {
    if (item.id === targetId) {
      collectAllIds(item, result);
      return true;
    }

    if (item.children?.length && collectDescendantIds(item.children, targetId, result)) {
      return true;
    }
  }

  return false;
}

function collectAllIds(item: DepartmentVo, result: Set<string>) {
  if (item.id) {
    result.add(item.id);
  }

  item.children?.forEach(child => collectAllIds(child, result));
}

function buildParentOptions(list: DepartmentVo[], excludeIds: Set<string>): TreeSelectOption[] {
  return (list || [])
    .filter(item => item.id && !excludeIds.has(item.id))
    .map(item => ({
      label: item.name || '未命名部门',
      value: item.id as string,
      children: item.children?.length ? buildParentOptions(item.children, excludeIds) : undefined
    }));
}

async function loadLeaderOptions() {
  leaderLoading.value = true;

  try {
    const { data, error } = await fetchUserOptions({
      accountStatus: '1',
      jobStatus: '1'
    });

    if (error) {
      return;
    }

    leaderOptions.value = (data || []).map((item: UserOptionVo) => {
      const suffix = item.employeeNo ? `（${item.employeeNo}）` : '';

      return {
        label: `${item.name || item.account || '未命名员工'}${suffix}`,
        value: item.id || ''
      };
    });
  } finally {
    leaderLoading.value = false;
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

  const payload: DepartmentBo = {
    id: formData.value.id || undefined,
    parentId: formData.value.parentId || '0',
    name: formData.value.name.trim(),
    leaderEmployeeId: formData.value.leaderEmployeeId || undefined,
    sort: Number(formData.value.sort || 0),
    status: formData.value.status || undefined,
    remark: formData.value.remark.trim() || undefined
  };

  submitting.value = true;

  try {
    const response = isEdit.value ? await fetchDepartmentUpdate(payload) : await fetchDepartmentAdd(payload);
    if (response.error) {
      return;
    }

    window.$message?.success(isEdit.value ? '部门更新成功' : '部门新增成功');
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
    :title="isEdit ? '编辑部门' : '新增部门'"
    :style="{ width: '720px' }"
    :mask-closable="false"
    @update:show="value => !value && handleClose()"
  >
    <NForm ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="88">
      <div class="grid grid-cols-2 gap-x-16px">
        <NFormItem label="上级部门" path="parentId">
          <NTreeSelect
            v-model:value="formData.parentId"
            :options="parentOptions"
            clearable
            default-expand-all
            key-field="value"
            label-field="label"
            children-field="children"
            placeholder="请选择上级部门"
          />
        </NFormItem>

        <NFormItem label="部门名称" path="name">
          <NInput v-model:value="formData.name" placeholder="请输入部门名称" />
        </NFormItem>

        <NFormItem label="负责人" path="leaderEmployeeId">
          <NSelect
            v-model:value="formData.leaderEmployeeId"
            :options="leaderOptions"
            :loading="leaderLoading"
            clearable
            filterable
            placeholder="请选择负责人"
          />
        </NFormItem>

        <NFormItem label="排序" path="sort">
          <NInputNumber v-model:value="formData.sort" class="w-full" :min="0" />
        </NFormItem>

        <NFormItem label="部门状态" path="status">
          <DictSelect v-model:model-value="formData.status" dict-code="department_status" placeholder="请选择部门状态" />
        </NFormItem>

        <div></div>

        <NFormItem class="col-span-2" label="备注" path="remark">
          <NInput v-model:value="formData.remark" type="textarea" :rows="4" placeholder="请输入备注" />
        </NFormItem>
      </div>
    </NForm>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="handleClose">取消</NButton>
        <NButton type="primary" :loading="submitting" @click="handleSubmit">确定</NButton>
      </NSpace>
    </template>
  </NModal>
</template>
