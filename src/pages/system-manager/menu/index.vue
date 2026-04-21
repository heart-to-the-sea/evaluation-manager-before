<script setup lang="ts">
import { computed, h } from 'vue';
import { AddCircle, ChevronDownOutline, ChevronUpOutline } from '@vicons/ionicons5';
import { NButton, NDataTable, NGrid, NGi, NIcon, NInput, NPopconfirm, NSpace, NTag } from 'naive-ui';
import type { DataTableColumns, DataTableRowKey } from 'naive-ui';
import AppIcon from '@/components/common/AppIcon.vue';
import MenuDialog from '@/components/features/menu/MenuDialog.vue';
import SearchTablePageLayout from '@/components/pages/SearchTablePageLayout.vue';
import { useTableSorter } from '@/composables/use-table-sorter';
import { fetchMenuDelete, fetchMenuTreeList } from '@/service/api';
import type { MenuVo } from '@/types/app';

definePageMeta({ title: '菜单管理' });

const searchParams = ref({ label: '', routeKey: '', routePath: '' });
const loading = ref(false);
const menuTree = ref<MenuVo[]>([]);
const expandedRowKeys = ref<string[]>([]);
const showDialog = ref(false);
const editingMenu = ref<Partial<MenuVo> | null>(null);
const { handleSorter, getSortOrder, appendSorter, createSorter, createSorterRender } = useTableSorter(() => loadData());
const sortableColumnKeys = new Set(['label', 'menuType', 'key', 'routeKey', 'routePath', 'sort', 'status', 'updatedAt']);

const totalCount = computed(() => countMenuNodes(menuTree.value));

const columns = computed<DataTableColumns<MenuVo>>(() => ([
  { title: '菜单名称', key: 'label', tree: true, minWidth: 220, render: row => row.label || '-' },
  {
    title: '类型', key: 'menuType', width: 90, align: 'center',
    render: row => h(NTag, { bordered: false, type: row.menuType === 'DIRECTORY' ? 'info' : 'success' }, { default: () => (row.menuType === 'DIRECTORY' ? '目录' : '菜单') })
  },
  { title: '菜单标识', key: 'key', minWidth: 180, render: row => row.key || '-' },
  { title: '页面标识', key: 'routeKey', minWidth: 180, render: row => row.routeKey || '-' },
  { title: '页面路径', key: 'routePath', minWidth: 220, render: row => row.routePath || '-' },
  { title: '布局方案', key: 'component', minWidth: 180, render: row => row.component || '自动匹配' },
  {
    title: '图标', key: 'icon', minWidth: 180,
    render: row => row.icon ? h(NSpace, { align: 'center', size: 8 }, { default: () => [h(AppIcon, { icon: row.icon, size: 18 }), h('span', null, row.icon)] }) : '-'
  },
  { title: '排序', key: 'sort', width: 80, align: 'center', render: row => String(row.sort ?? 0) },
  {
    title: '状态', key: 'status', width: 90, align: 'center',
    render: row => h(NTag, { bordered: false, type: row.status === 1 ? 'success' : 'error' }, { default: () => (row.status === 1 ? '启用' : '禁用') })
  },
  {
    title: '菜单显示', key: 'hideInMenu', width: 100, align: 'center',
    render: row => h(NTag, { bordered: false, type: row.hideInMenu ? 'warning' : 'success' }, { default: () => (row.hideInMenu ? '隐藏' : '显示') })
  },
  {
    title: '缓存', key: 'keepAlive', width: 90, align: 'center',
    render: row => h(NTag, { bordered: false, type: row.keepAlive ? 'success' : 'default' }, { default: () => (row.keepAlive ? '开启' : '关闭') })
  },
  { title: '更新时间', key: 'updatedAt', width: 180, render: row => row.updatedAt || '-' },
  {
    title: '操作', key: 'actions', width: 220, fixed: 'right', align: 'center',
    render: row => h('div', { class: 'em-table-actions' }, {
      default: () => [
        h(NButton, { size: 'small', quaternary: true, type: 'primary', onClick: () => handleAddChild(row) }, { default: () => '新增子级' }),
        h(NButton, { size: 'small', quaternary: true, type: 'primary', onClick: () => handleEdit(row) }, { default: () => '编辑' }),
        h(NPopconfirm, { onPositiveClick: () => handleDelete(row) }, {
          trigger: () => h(NButton, { size: 'small', quaternary: true, type: 'error' }, { default: () => '删除' }),
          default: () => '确认删除该菜单及其所有子菜单吗？'
        })
      ]
    })
  }
] as DataTableColumns<MenuVo>).map(column => {
  const columnKey = typeof column.key === 'string' ? column.key : '';
  if (!sortableColumnKeys.has(columnKey)) {
    return column;
  }
  return {
    ...column,
    sorter: createSorter(),
    sortOrder: getSortOrder(columnKey),
    renderSorter: createSorterRender(columnKey)
  };
}));

onMounted(() => { loadData(); });

async function loadData() {
  loading.value = true;
  try {
    const { data } = await fetchMenuTreeList(appendSorter({
      label: searchParams.value.label || undefined,
      routeKey: searchParams.value.routeKey || undefined,
      routePath: searchParams.value.routePath || undefined
    }));
    menuTree.value = data || [];
    expandedRowKeys.value = collectExpandedKeys(menuTree.value);
  } finally {
    loading.value = false;
  }
}

function collectExpandedKeys(list: MenuVo[]) {
  return list.reduce<string[]>((result, item) => {
    if (item.id && item.children?.length) {
      result.push(item.id);
      result.push(...collectExpandedKeys(item.children));
    }
    return result;
  }, []);
}

function countMenuNodes(list: MenuVo[]) {
  return list.reduce((total, item) => total + 1 + countMenuNodes(item.children || []), 0);
}

function handleSearch() { loadData(); }
function handleReset() {
  searchParams.value = { label: '', routeKey: '', routePath: '' };
  loadData();
}
function handleAddRoot() {
  editingMenu.value = { parentId: '0', menuType: 'MENU', status: 1, sort: 0, hideInMenu: false, keepAlive: false };
  showDialog.value = true;
}
function handleAddChild(row: MenuVo) {
  editingMenu.value = { parentId: row.id, menuType: 'MENU', status: 1, sort: 0, hideInMenu: false, keepAlive: false };
  showDialog.value = true;
}
function handleEdit(row: MenuVo) { editingMenu.value = { ...row }; showDialog.value = true; }
async function handleDelete(row: MenuVo) {
  if (!row.id) return;
  const { error } = await fetchMenuDelete(row.id);
  if (error) return;
  window.$message?.success('菜单删除成功');
  await loadData();
}
function handleExpandAll() { expandedRowKeys.value = collectExpandedKeys(menuTree.value); }
function handleCollapseAll() { expandedRowKeys.value = []; }
function handleExpandedKeysChange(keys: DataTableRowKey[]) { expandedRowKeys.value = keys.map(String); }
function handleDialogClose(submitted = false) {
  showDialog.value = false;
  editingMenu.value = null;
  if (submitted) loadData();
}
</script>

<template>
  <SearchTablePageLayout :total="totalCount" @refresh="loadData">
    <template #searchBox>
      <NGrid :cols="12">
        <NGi span="12">
          <NSpace justify="end">
            <NInput v-model:value="searchParams.label" placeholder="请输入菜单名称" clearable style="width: 180px" @keyup.enter="handleSearch" />
            <NInput v-model:value="searchParams.routeKey" placeholder="请输入页面标识" clearable style="width: 180px" @keyup.enter="handleSearch" />
            <NInput v-model:value="searchParams.routePath" placeholder="请输入页面路径" clearable style="width: 220px" @keyup.enter="handleSearch" />
            <NButton type="primary" @click="handleSearch">查询</NButton>
            <NButton @click="handleReset">重置</NButton>
          </NSpace>
        </NGi>
      </NGrid>
    </template>

    <template #h-btns>
      <NButton type="primary" class="mr-8px" @click="handleAddRoot">
        <NIcon class="mr-6px" size="18"><AddCircle /></NIcon>
        新增根菜单
      </NButton>
      <NButton class="mr-8px" @click="handleExpandAll">
        <NIcon class="mr-6px" size="16"><ChevronDownOutline /></NIcon>
        全部展开
      </NButton>
      <NButton @click="handleCollapseAll">
        <NIcon class="mr-6px" size="16"><ChevronUpOutline /></NIcon>
        全部收起
      </NButton>
    </template>

    <NDataTable
      :bordered="false"
      :single-line="false"
      :columns="columns"
      :data="menuTree"
      :loading="loading"
      :pagination="false"
      :expanded-row-keys="expandedRowKeys"
      flex-height
      :row-key="row => row.id || ''"
      remote
      :style="{ height: '100%' }"
      @update:expanded-row-keys="handleExpandedKeysChange"
      @update:sorter="handleSorter"
    />

    <MenuDialog :show="showDialog" :data="editingMenu" :menu-tree="menuTree" @close="handleDialogClose" />
  </SearchTablePageLayout>
</template>
