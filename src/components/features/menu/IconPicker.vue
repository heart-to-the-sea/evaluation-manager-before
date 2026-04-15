<script setup lang="ts">
import { NButton, NEmpty, NInput, NPopover, NScrollbar, NSpace, NTag } from 'naive-ui';
import mdiIcons from '@iconify-json/mdi/icons.json';
import AppIcon from '@/components/common/AppIcon.vue';

interface Props {
  value?: string;
}

withDefaults(defineProps<Props>(), {
  value: ''
});

const emit = defineEmits<{
  'update:value': [value: string];
}>();

const keyword = ref('');
const iconNames = Object.keys(mdiIcons.icons);

const filteredIcons = computed(() => {
  const search = keyword.value.trim().toLowerCase();

  if (!search) {
    return iconNames;
  }

  return iconNames.filter(name => name.includes(search));
});

function selectIcon(name: string) {
  emit('update:value', `mdi:${name}`);
}

function clearIcon() {
  emit('update:value', '');
}
</script>

<template>
  <NPopover trigger="click" placement="bottom-start" :width="520">
    <template #trigger>
      <NButton class="w-full justify-start" secondary>
        <div class="flex w-full items-center justify-between gap-12px overflow-hidden">
          <div class="flex items-center gap-10px overflow-hidden">
            <AppIcon :icon="value || 'mdi:menu'" :size="18" />
            <span class="truncate">{{ value || '请选择图标' }}</span>
          </div>
          <span class="hint-text">点击选择</span>
        </div>
      </NButton>
    </template>

    <div class="icon-picker-panel">
      <NSpace vertical :size="12">
        <div class="flex items-center justify-between gap-12px">
          <NInput v-model:value="keyword" clearable placeholder="搜索 mdi 图标，例如 menu、home、account" />
          <NButton v-if="value" quaternary @click="clearIcon">清空</NButton>
        </div>

        <div class="picker-head">
          <span>当前图标：{{ value || '未选择' }}</span>
          <NTag size="small" type="primary" :bordered="false">共 {{ filteredIcons.length }} 个</NTag>
        </div>

        <NScrollbar style="max-height: 320px">
          <div v-if="filteredIcons.length" class="icon-grid">
            <button
              v-for="name in filteredIcons"
              :key="name"
              class="icon-item"
              :class="{ 'icon-item--active': value === `mdi:${name}` }"
              type="button"
              :title="`mdi:${name}`"
              @click="selectIcon(name)"
            >
              <AppIcon :icon="`mdi:${name}`" :size="20" />
            </button>
          </div>

          <NEmpty v-else description="没有找到匹配图标" class="py-24px" />
        </NScrollbar>
      </NSpace>
    </div>
  </NPopover>
</template>

<style scoped>
.icon-picker-panel {
  padding: 4px;
}

.hint-text,
.picker-head {
  color: rgb(var(--muted-text-color));
  font-size: 12px;
}

.picker-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 8px;
  padding-right: 4px;
}

.icon-item {
  display: flex;
  height: 42px;
  width: 42px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgb(var(--border-color));
  border-radius: 8px;
  background: rgb(var(--container-bg-color));
  color: rgb(var(--base-text-color));
  cursor: pointer;
  transition: all 0.2s ease;
}

.icon-item:hover {
  border-color: var(--em-primary-color);
  color: var(--em-primary-color);
  background: rgb(var(--em-primary-color-rgb) / 10%);
}

.icon-item--active {
  border-color: var(--em-primary-color);
  color: var(--em-primary-color);
  background: rgb(var(--em-primary-color-rgb) / 14%);
  box-shadow: 0 0 0 2px rgb(var(--em-primary-color-rgb) / 10%);
}
</style>
