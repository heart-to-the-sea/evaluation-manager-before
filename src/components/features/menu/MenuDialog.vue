<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NButton, NForm, NFormItem, NInput, NInputNumber, NModal, NSelect, NSpace, NSwitch, NTreeSelect } from 'naive-ui';
import type { FormInst, FormRules, SelectOption, TreeSelectOption } from 'naive-ui';
import { PAGE_ROUTE_TEMPLATES } from '@/constants/page-routes';
import type { MenuVo } from '@/types/app';
import { fetchMenuAdd, fetchMenuUpdate } from '@/service/api';
import IconPicker from './IconPicker.vue';

interface Props {
  show: boolean;
  data: Partial<MenuVo> | null;
  menuTree: MenuVo[];
}

const props = defineProps<Props>();
const emit = defineEmits<{ close: [submitted?: boolean] }>();

const formRef = ref<FormInst | null>(null);
const submitting = ref(false);

const formData = ref({
  id: '',
  parentId: '0',
  key: '',
  label: '',
  menuType: 'MENU' as 'DIRECTORY' | 'MENU',
  routeTemplate: '',
  routeKey: '',
  routePath: '',
  component: '',
  icon: 'mdi:menu',
  sort: 0,
  status: 1,
  hideInMenu: false,
  keepAlive: false
});

const isEdit = computed(() => Boolean(props.data?.id));
const isDirectory = computed(() => formData.value.menuType === 'DIRECTORY');

const menuTypeOptions: SelectOption[] = [
  { label: '目录', value: 'DIRECTORY' },
  { label: '菜单', value: 'MENU' }
];

const statusOptions: SelectOption[] = [
  { label: '启用', value: 1 },
  { label: '禁用', value: 0 }
];

const layoutSchemeOptions: SelectOption[] = [
  { label: '自动匹配', value: '' },
  { label: '全屏展示', value: 'layout.blank' }
];

const routeTemplateOptions = PAGE_ROUTE_TEMPLATES.map(item => ({
  label: `${item.label}（${item.routePath}）`,
  value: item.routeKey
}));

const rules = computed<FormRules>(() => ({
  key: [{ required: true, message: '请输入菜单标识', trigger: ['input', 'blur'] }],
  label: [{ required: true, message: '请输入菜单名称', trigger: ['input', 'blur'] }],
  menuType: [{ required: true, message: '请选择菜单类型', trigger: ['change'] }],
  routeKey: [{ required: true, message: isDirectory.value ? '请输入目录标识' : '请选择页面路由', trigger: ['change', 'blur'] }],
  routePath: [{ required: true, message: isDirectory.value ? '请输入目录路径' : '请选择页面路由', trigger: ['change', 'blur'] }]
}));

const excludedIds = computed(() => {
  const ids = new Set<string>();
  const currentId = props.data?.id;
  if (!currentId) {
    return ids;
  }

  collectDescendantIds(props.menuTree, currentId, ids);
  return ids;
});

const parentOptions = computed<TreeSelectOption[]>(() => [
  {
    label: '根菜单',
    value: '0',
    children: buildParentTreeOptions(props.menuTree, excludedIds.value)
  }
]);

watch(
  () => props.show,
  visible => {
    if (visible) {
      initFormData();
    }
  }
);

watch(
  () => formData.value.menuType,
  () => {
    if (formData.value.component !== 'layout.blank') {
      formData.value.component = '';
    }
  }
);

function initFormData() {
  formData.value = {
    id: props.data?.id || '',
    parentId: props.data?.parentId || '0',
    key: props.data?.key || props.data?.routeKey || '',
    label: props.data?.label || '',
    menuType: (props.data?.menuType as 'DIRECTORY' | 'MENU') || 'MENU',
    routeTemplate: '',
    routeKey: props.data?.routeKey || '',
    routePath: props.data?.routePath || '',
    component:
      props.data?.component === 'layout.blank' || props.data?.component?.startsWith('layout.blank$')
        ? 'layout.blank'
        : '',
    icon: props.data?.icon || 'mdi:menu',
    sort: props.data?.sort ?? 0,
    status: props.data?.status ?? 1,
    hideInMenu: props.data?.hideInMenu ?? false,
    keepAlive: props.data?.keepAlive ?? false
  };

  const matchedTemplate = PAGE_ROUTE_TEMPLATES.find(
    item => item.routeKey === formData.value.routeKey && item.routePath === formData.value.routePath
  );

  if (matchedTemplate) {
    formData.value.routeTemplate = matchedTemplate.routeKey;
  }
}

function collectDescendantIds(list: MenuVo[], targetId: string, result: Set<string>) {
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

function collectAllIds(menu: MenuVo, result: Set<string>) {
  if (menu.id) {
    result.add(menu.id);
  }

  menu.children?.forEach(child => collectAllIds(child, result));
}

function buildParentTreeOptions(list: MenuVo[], excludeIds: Set<string>): TreeSelectOption[] {
  return list
    .filter(item => item.id && !excludeIds.has(item.id))
    .map(item => ({
      label: item.label || item.routeKey || item.key || '未命名菜单',
      value: item.id as string,
      children: item.children?.length ? buildParentTreeOptions(item.children, excludeIds) : undefined
    }));
}

function handleTemplateChange(value: string | null) {
  const template = PAGE_ROUTE_TEMPLATES.find(item => item.routeKey === value);

  if (!template) {
    formData.value.routeTemplate = '';
    formData.value.routeKey = '';
    formData.value.routePath = '';
    return;
  }

  formData.value.routeTemplate = template.routeKey;
  formData.value.routeKey = template.routeKey;
  formData.value.routePath = template.routePath;

  if (!formData.value.key) {
    formData.value.key = template.routeKey;
  }

  if (!formData.value.label) {
    formData.value.label = template.label;
  }
}

async function handleSubmit() {
  const menuStore = useMenuStore();

  try {
    await formRef.value?.validate();
  } catch {
    return;
  }

  submitting.value = true;

  try {
    const payload: MenuVo = {
      id: formData.value.id || undefined,
      parentId: formData.value.parentId || '0',
      key: formData.value.key,
      label: formData.value.label,
      menuType: formData.value.menuType,
      i18nKey: '',
      routeKey: formData.value.routeKey,
      routePath: formData.value.routePath,
      component: formData.value.component === 'layout.blank' ? 'layout.blank' : undefined,
      icon: formData.value.icon || undefined,
      sort: Number(formData.value.sort || 0),
      status: formData.value.status,
      hideInMenu: formData.value.hideInMenu,
      keepAlive: formData.value.keepAlive
    };

    if (isEdit.value) {
      await fetchMenuUpdate(payload);
      await menuStore.ensureLoaded(true);
      window.$message?.success('菜单更新成功');
    } else {
      await fetchMenuAdd(payload);
      await menuStore.ensureLoaded(true);
      window.$message?.success('菜单新增成功');
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
    :title="isEdit ? '编辑菜单' : '新增菜单'"
    :style="{ width: '780px' }"
    :mask-closable="false"
    @update:show="value => !value && emit('close', false)"
  >
    <NForm ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="96">
      <div class="grid grid-cols-2 gap-x-16px">
        <NFormItem label="菜单名称" path="label">
          <NInput v-model:value="formData.label" placeholder="请输入菜单名称" />
        </NFormItem>

        <NFormItem label="菜单标识" path="key">
          <NInput v-model:value="formData.key" placeholder="请输入菜单标识" />
        </NFormItem>

        <NFormItem label="菜单类型" path="menuType">
          <NSelect v-model:value="formData.menuType" :options="menuTypeOptions" />
        </NFormItem>

        <NFormItem label="上级菜单" path="parentId">
          <NTreeSelect
            v-model:value="formData.parentId"
            :options="parentOptions"
            clearable
            default-expand-all
            key-field="value"
            label-field="label"
            children-field="children"
          />
        </NFormItem>

        <template v-if="isDirectory">
          <NFormItem label="目录标识" path="routeKey">
            <NInput v-model:value="formData.routeKey" placeholder="例如：system-manager" />
          </NFormItem>

          <NFormItem label="目录路径" path="routePath">
            <NInput v-model:value="formData.routePath" placeholder="例如：/system-manager" />
          </NFormItem>
        </template>

        <template v-else>
          <NFormItem label="页面路由" path="routeKey">
            <NSelect
              v-model:value="formData.routeTemplate"
              :options="routeTemplateOptions"
              filterable
              clearable
              placeholder="请选择页面路由"
              @update:value="handleTemplateChange"
            />
          </NFormItem>

          <NFormItem label="页面路径" path="routePath">
            <NInput :value="formData.routePath" readonly placeholder="选择页面路由后自动带出" />
          </NFormItem>

          <NFormItem label="页面标识">
            <NInput :value="formData.routeKey" readonly placeholder="选择页面路由后自动带出" />
          </NFormItem>
        </template>

        <NFormItem label="布局方案" path="component">
          <NSelect v-model:value="formData.component" :options="layoutSchemeOptions" />
        </NFormItem>

        <NFormItem label="菜单图标" path="icon">
          <IconPicker v-model:value="formData.icon" />
        </NFormItem>

        <NFormItem label="排序" path="sort">
          <NInputNumber v-model:value="formData.sort" class="w-full" :min="0" />
        </NFormItem>

        <NFormItem label="状态" path="status">
          <NSelect v-model:value="formData.status" :options="statusOptions" />
        </NFormItem>

        <NFormItem label="菜单显示" path="hideInMenu">
          <NSwitch v-model:value="formData.hideInMenu" />
        </NFormItem>

        <NFormItem label="页面缓存" path="keepAlive">
          <NSwitch v-model:value="formData.keepAlive" />
        </NFormItem>
      </div>
    </NForm>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="emit('close', false)">取消</NButton>
        <NButton type="primary" :loading="submitting" @click="handleSubmit">确定</NButton>
      </NSpace>
    </template>
  </NModal>
</template>
