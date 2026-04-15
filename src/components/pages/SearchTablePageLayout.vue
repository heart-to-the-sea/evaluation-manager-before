<script lang="ts" setup>
import { computed, ref } from 'vue';
import { NCard, NIcon, useThemeVars } from 'naive-ui';
import { SearchCircle } from '@vicons/ionicons5';

const themeVars = useThemeVars();
const showSearch = ref(false);
const route = useRoute();

const isFullscreenLayout = computed(() => route.meta.layout === 'blank');
</script>

<template>
  <div class="page-layout" :class="{ 'page-layout--fullscreen': isFullscreenLayout }">
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
            <NIcon size="36" :component="SearchCircle" style="cursor: pointer" :color="themeVars.primaryColor"
              @click="showSearch = !showSearch"></NIcon>
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
  min-height: 0;
  flex: 1;
  height: 100%;
  flex-direction: column;
  padding: 16px;
}

.page-layout--fullscreen {
  height: 100vh;
}

.search-card {
  margin-bottom: 16px;
  height: fit-content;
}

.content-card {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
}

.content-card :deep(.n-card__content) {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
}

.handler {
  width: 100%;
  min-height: 34px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgb(var(--border-color));
}

.handler-actions,
.handler-tools,
.search-box-wrapper {
  :deep(.n-button) {
    height: 32px !important;
    padding: 0 14px !important;
    border-radius: 6px !important;
    font-size: 13px !important;
  }
}

.search-box-wrapper {
  :deep(.n-input),
  :deep(.n-base-selection),
  :deep(.n-date-picker) {
    border-radius: 6px !important;
  }
}

.search-box-wrapper {
  padding: 2px 0;
}

.content-box {
  display: flex;
  min-height: 0;
  flex: 1;
  overflow: hidden;
}

.content-box :deep(.table-page-fill) {
  min-height: 0;
  flex: 1;
}

.content-box :deep(.n-data-table) {
  min-height: 0;
  flex: 1;
}
</style>
