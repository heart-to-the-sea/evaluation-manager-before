<script lang="ts" setup>
import { ref } from 'vue';
import { NCard, NIcon, useThemeVars } from 'naive-ui';
import { RefreshCircle, SearchCircle } from '@vicons/ionicons5';

const themeVars = useThemeVars();
const showSearch = ref(false);

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
  gap: 4px;
}

.tool-icon {
  cursor: pointer;
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
