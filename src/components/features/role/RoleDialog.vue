<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NButton, NForm, NFormItem, NInput, NModal, NSelect, NSpace, NSwitch, NTree } from 'naive-ui';
import type { FormInst, FormRules, TreeOption } from 'naive-ui';
import { fetchRoleAdd, fetchRoleUpdate } from '@/service/api';
import type { MenuVo, RoleBo, RoleVo } from '@/types/app';

interface Props {
  show: boolean;
  data: RoleVo | null;
  menuTree: MenuVo[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [submitted?: boolean];
}>();

const formRef = ref<FormInst | null>(null);
const submitting = ref(false);

const formData = ref<RoleBo>({
  id: '',
  name: '',
  code: '',
  description: '',
  status: 1,
  menuCheckStrictly: false,
  menuIds: []
});

const rules: FormRules = {
  name: [{ required: true, message: '请输入角色名称', trigger: ['input', 'blur'] }],
  code: [{ required: true, message: '请输入角色编码', trigger: ['input', 'blur'] }],
  status: [{ required: true, type: 'number', message: '请选择角色状态', trigger: ['change'] }]
};

const statusOptions = [
  { label: '启用', value: 1 },
  { label: '禁用', value: 0 }
];

const treeOptions = computed<TreeOption[]>(() => buildMenuTreeOptions(props.menuTree));
const checkedKeys = ref<string[]>([]);
const expandedKeys = ref<string[]>([]);
const allMenuKeys = computed(() => collectMenuKeys(props.menuTree));

const isEdit = computed(() => Boolean(formData.value.id));

watch(
  () => props.show,
  visible => {
    if (visible) {
      initFormData();
    }
  }
);

watch(
  () => props.data,
  () => {
    if (props.show) {
      initFormData();
    }
  }
);

function initFormData() {
  formData.value = {
    id: props.data?.id || '',
    name: props.data?.name || '',
    code: props.data?.code || '',
    description: props.data?.description || '',
    status: props.data?.status ?? 1,
    menuCheckStrictly: Boolean(props.data?.menuCheckStrictly),
    menuIds: props.data?.menuIds ? [...props.data.menuIds] : []
  };
  checkedKeys.value = [...(formData.value.menuIds || [])];
  expandedKeys.value = [...allMenuKeys.value];
}

function buildMenuTreeOptions(list: MenuVo[]): TreeOption[] {
  return list.map(item => ({
    key: item.id || '',
    label: item.label || item.routeKey || item.key || '未命名菜单',
    children: item.children?.length ? buildMenuTreeOptions(item.children) : undefined
  }));
}

function collectMenuKeys(list: MenuVo[]) {
  return list.reduce<string[]>((result, item) => {
    if (item.id) {
      result.push(item.id);
    }
    if (item.children?.length) {
      result.push(...collectMenuKeys(item.children));
    }
    return result;
  }, []);
}

function handleCheckStrictlyChange(value: boolean) {
  formData.value.menuCheckStrictly = value;
}

function handleCheckAll() {
  checkedKeys.value = [...allMenuKeys.value];
}

function handleClearAll() {
  checkedKeys.value = [];
}

function handleInvertCheck() {
  const selectedKeySet = new Set(checkedKeys.value);
  checkedKeys.value = allMenuKeys.value.filter(key => !selectedKeySet.has(key));
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
    const payload: RoleBo = {
      id: formData.value.id || undefined,
      name: formData.value.name?.trim(),
      code: formData.value.code?.trim(),
      description: formData.value.description?.trim(),
      status: formData.value.status ?? 1,
      menuCheckStrictly: Boolean(formData.value.menuCheckStrictly),
      menuIds: [...checkedKeys.value]
    };

    if (isEdit.value) {
      await fetchRoleUpdate(payload);
      window.$message?.success('角色更新成功');
    } else {
      await fetchRoleAdd(payload);
      window.$message?.success('角色新增成功');
    }

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
    :title="isEdit ? '编辑角色' : '新增角色'"
    :style="{ width: '880px' }"
    :mask-closable="false"
    @update:show="value => !value && handleClose()"
  >
    <NForm ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="88">
      <div class="grid grid-cols-2 gap-x-16px">
        <NFormItem label="角色名称" path="name">
          <NInput v-model:value="formData.name" placeholder="请输入角色名称" />
        </NFormItem>

        <NFormItem label="角色编码" path="code">
          <NInput v-model:value="formData.code" placeholder="请输入角色编码" />
        </NFormItem>

        <NFormItem label="角色状态" path="status">
          <NSelect v-model:value="formData.status" :options="statusOptions" />
        </NFormItem>

        <NFormItem label="角色说明">
          <NInput v-model:value="formData.description" placeholder="请输入角色说明" />
        </NFormItem>
      </div>

      <NFormItem label="菜单权限" path="menuIds">
        <div class="role-menu-tree">
          <div class="role-menu-tree__toolbar">
            <NSpace :size="12" align="center" wrap>
              <NButton class="role-menu-tree__toolbar-btn" quaternary type="primary" @click="handleCheckAll">全选</NButton>
              <NButton class="role-menu-tree__toolbar-btn" quaternary @click="handleClearAll">清空</NButton>
              <NButton class="role-menu-tree__toolbar-btn" quaternary @click="handleInvertCheck">反选</NButton>
              <div class="role-menu-tree__switch-wrap">
                <span class="role-menu-tree__switch-label">父子联动</span>
                <NSwitch :value="!formData.menuCheckStrictly" @update:value="value => handleCheckStrictlyChange(!value)">
                  <template #checked>开启</template>
                  <template #unchecked>关闭</template>
                </NSwitch>
              </div>
            </NSpace>
          </div>
          <div class="role-menu-tree__content">
            <NTree
              v-model:checked-keys="checkedKeys"
              v-model:expanded-keys="expandedKeys"
              block-line
              :cascade="!formData.menuCheckStrictly"
              checkable
              check-on-click
              default-expand-all
              :data="treeOptions"
            />
          </div>
        </div>
      </NFormItem>
    </NForm>

    <template #footer>
      <NSpace justify="end" :size="16">
        <NButton @click="handleClose">取消</NButton>
        <NButton type="primary" :loading="submitting" @click="handleSubmit">确定</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped lang="scss">
.role-menu-tree {
  width: 100%;
  height: 420px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 8px 12px 12px;
  border-radius: 12px;
  background: var(--em-card-color);
  box-shadow: inset 0 0 0 1px var(--em-border-color);
}

.role-menu-tree__toolbar {
  flex: 0 0 auto;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--em-border-color);

  :deep(.n-button) {
    height: 34px !important;
    padding: 0 18px !important;
    border-radius: 6px !important;
    font-size: 13px !important;
  }
}

.role-menu-tree__content {
  flex: 1;
  min-height: 0;
  overflow: auto;
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgb(var(--em-primary-color-rgb) / 0.035);
  box-shadow: inset 0 0 0 1px rgb(var(--em-primary-color-rgb) / 0.08);

  :deep(.n-tree-node-content) {
    border-radius: 8px;
  }

  :deep(.n-tree-node-content:hover) {
    background: rgb(var(--em-primary-color-rgb) / 0.08);
  }

  :deep(.n-tree-node--selected .n-tree-node-content) {
    background: rgb(var(--em-primary-color-rgb) / 0.12);
  }
}

.role-menu-tree__toolbar-btn {
  flex: 0 0 auto;
}

.role-menu-tree__switch-wrap {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 34px;
  padding: 0 12px;
  border-radius: 10px;
  background: rgb(var(--em-primary-color-rgb) / 0.06);
  box-shadow: inset 0 0 0 1px rgb(var(--em-primary-color-rgb) / 0.08);
}

.role-menu-tree__switch-label {
  color: var(--n-text-color);
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}
</style>
