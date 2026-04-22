<script lang="ts" setup>
import { computed, ref } from 'vue';
import { NCard, NIcon, useThemeVars } from 'naive-ui';
import { RefreshCircle, SearchCircle } from '@vicons/ionicons5';

interface PaginationLike {
  itemCount?: number | string | null;
}

interface Props {
  total?: number | string | null;
  pagination?: PaginationLike | null;
}

const props = withDefaults(defineProps<Props>(), {
  total: null
});

const themeVars = useThemeVars();
const showSearch = ref(false);
const displayTotal = computed(() => {
  const raw = props.pagination?.itemCount ?? props.total;
  if (raw === null || raw === undefined || raw === '') {
    return null;
  }
  const total = Number(raw);
  return Number.isNaN(total) ? raw : total;
});

const emit = defineEmits<{
  refresh: [];
}>();
</script>

<template>
  <div class="page-layout">
    <NCard v-if="showSearch" :bordered="false" class="card-wrapper search-card">
      <div class="search-box-wrapper">
        <slot name="searchBox">123</slot>
      </div>
    </NCard>

    <NCard class="card-wrapper content-card" :bordered="false">
      <div class="handler">
        <div class="handler-actions">
          <slot name="h-btns"></slot>
        </div>

        <slot name="btns">
          <div class="handler-tools">
            <div v-if="displayTotal !== null && displayTotal !== undefined" class="handler-total">共 {{ displayTotal }} 条</div>
            <NIcon size="36" :component="RefreshCircle" class="tool-icon" :color="themeVars.primaryColor" @click="emit('refresh')" />
            <NIcon size="36" :component="SearchCircle" style="cursor: pointer" :color="themeVars.primaryColor" @click="showSearch = !showSearch" />
          </div>
        </slot>
      </div>

      <div class="content-box">
        <slot>contentBox</slot>
      </div>
    </NCard>
  </div>
</template>

<style lang="scss" scoped>
.page-layout {
  display: flex;
  height: calc(100vh - 100px);
  flex-direction: column;
  padding: 16px;
}

.search-card {
  margin-bottom: 16px;
  height: fit-content;
}

.content-card {
  height: 100%;
}

.handler {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 34px;
  margin-bottom: 12px;
}

.handler-actions,
.handler-tools,
.search-box-wrapper {
  :deep(.n-button) {
    height: 34px !important;
    padding: 0 18px !important;
    border-radius: 6px !important;
    font-size: 13px !important;
  }
}

.handler-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.handler-tools {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tool-icon {
  cursor: pointer;
}

.handler-total {
  display: inline-flex;
  align-items: center;
  height: 34px;
  padding: 0 12px;
  border-radius: 17px;
  background: rgb(var(--em-primary-color-rgb) / 8%);
  box-shadow: inset 0 0 0 1px rgb(var(--em-primary-color-rgb) / 12%);
  color: var(--em-primary-color);
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.search-box-wrapper {
  :deep(.n-input),
  :deep(.n-base-selection),
  :deep(.n-date-picker) {
    border-radius: 6px !important;
  }
}

.content-box {
  height: calc(100% - 46px);
}
</style>
