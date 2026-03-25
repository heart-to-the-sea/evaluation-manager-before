<script lang="ts" setup>
import { ref } from 'vue';
import { useThemeVars } from 'naive-ui';
import { SearchCircle } from '@vicons/ionicons5';

const themeVars = useThemeVars();
const showSearch = ref(false);
</script>

<template>
  <div style="padding: 16px; height: calc(100vh - 100px); display: flex; flex-direction: column">
    <NCard v-if="showSearch" :bordered="false" class="card-wrapper" style="margin-bottom: 16px; height: fit-content">
      <div>
        <slot name="searchBox">123</slot>
      </div>
    </NCard>
    <NCard style="height: 100%" class="card-wrapper" :bordered="false">
      <div class="handler">
        <div>
          <slot name="h-btns"></slot>
        </div>
        <slot name="btns">
          <div>
            <NIcon
              size="36"
              :component="SearchCircle"
              style="cursor: pointer"
              :color="themeVars.primaryColor"
              @click="showSearch = !showSearch"
            ></NIcon>
          </div>
        </slot>
      </div>
      <div style="height: calc(100% - 56px)">
        <slot>contentBox</slot>
      </div>
    </NCard>
  </div>
</template>

<style lang="scss" scoped>
.handler {
  width: 100%;
  height: 34px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
</style>
