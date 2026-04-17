<script setup lang="ts">
const slots = useSlots();
const hasHeader = computed(() => Boolean(slots.header || slots.title || slots.actions));
</script>

<template>
  <div class="info-page-layout">
    <div class="info-page-layout__viewport">
      <div v-if="hasHeader" class="info-page-layout__header">
        <slot name="header">
          <div class="info-page-layout__header-inner">
            <div class="info-page-layout__title">
              <slot name="title"></slot>
            </div>
            <div v-if="$slots.actions" class="info-page-layout__actions">
              <slot name="actions"></slot>
            </div>
          </div>
        </slot>
      </div>
      <div class="info-page-layout__content">
        <div class="info-page-layout__content-inner">
          <slot name="contentBox">123</slot>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/scrollbar' as scrollbar;

.info-page-layout {
  display: flex;
  height: calc(100vh - 100px);
  min-height: 0;
  flex-direction: column;
  padding: 16px;
  overflow: hidden;
}

.info-page-layout__viewport {
  box-sizing: border-box;
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
  border-radius: 8px;
  background: rgb(var(--container-bg-color));
  box-shadow: var(--card-box-shadow);
  transition:
    background-color 0.3s ease,
    box-shadow 0.3s ease;
}

.info-page-layout__header {
  flex-shrink: 0;
  padding: 16px 20px;
  border-bottom: 1px solid rgb(var(--border-color) / 85%);
  background: rgb(var(--container-bg-color));
  transition:
    background-color 0.3s ease,
    border-color 0.3s ease;
}

.info-page-layout__header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.info-page-layout__title {
  min-width: 0;
  font-size: 18px;
  font-weight: 600;
  color: rgb(var(--base-text-color));
}

.info-page-layout__actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.info-page-layout__content {
  box-sizing: border-box;
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  margin-bottom: 16px;
  @include scrollbar.scrollbar(7px, rgb(31 35 41 / 18%), rgb(255 255 255 / 18%));
}

.info-page-layout__content-inner {
  box-sizing: border-box;
  min-height: 100%;
  padding: 16px 20px 20px;
}

@media (width <=960px) {
  .info-page-layout__header-inner {
    flex-direction: column;
    align-items: flex-start;
  }

  .info-page-layout__actions {
    flex-wrap: wrap;
  }
}
</style>
