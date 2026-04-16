<script setup lang="ts">
import AppIcon from '@/components/common/AppIcon.vue';
import type { AppMenuOption } from '@/types/app';

interface Props {
  menus: AppMenuOption[];
  activeKey?: string | null;
  collapsed?: boolean;
  inverted?: boolean;
  showLogo?: boolean;
}

withDefaults(defineProps<Props>(), {
  activeKey: null,
  collapsed: false,
  inverted: false,
  showLogo: true
});

const emit = defineEmits<{
  select: [key: string];
}>();
</script>

<template>
  <div class="rail-menu" :class="{ 'rail-menu--inverted': inverted }">
    <div v-if="showLogo" class="rail-logo">
      <div class="rail-logo__mark">评</div>
    </div>

    <div class="rail-menu__list">
      <button
        v-for="item in menus"
        :key="item.key"
        type="button"
        class="rail-menu__item"
        :class="{ 'rail-menu__item--active': activeKey === item.key }"
        @click="emit('select', item.key)"
      >
        <AppIcon :icon="item.icon || 'mdi:menu'" :size="20" />
        <span v-if="!collapsed" class="rail-menu__label">{{ item.label }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.rail-menu {
  display: flex;
  height: 100%;
  flex-direction: column;
  background: rgb(var(--container-bg-color));
  color: rgb(var(--base-text-color));
  transition:
    background-color 0.3s ease,
    color 0.3s ease;
}

.rail-menu--inverted {
  background: rgb(var(--inverted-bg-color));
  color: rgb(255 255 255 / 88%);
}

.rail-logo {
  display: flex;
  height: var(--em-header-height);
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgb(var(--border-color));
}

.rail-menu--inverted .rail-logo {
  border-bottom-color: rgb(255 255 255 / 12%);
}

.rail-logo__mark {
  display: flex;
  height: 40px;
  width: 40px;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: var(--em-primary-color);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
}

.rail-menu__list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
  padding: 8px 6px;
}

.rail-menu__item {
  display: flex;
  min-height: 56px;
  width: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: inherit;
  padding: 8px 6px;
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;
}

.rail-menu__item:hover {
  background: rgb(var(--em-primary-color-rgb) / 8%);
}

.rail-menu__item--active {
  background: var(--em-primary-color);
  color: #fff;
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 10%);
}

.rail-menu--inverted .rail-menu__item:hover {
  background: rgb(255 255 255 / 9%);
}

.rail-menu--inverted .rail-menu__item--active {
  background: var(--em-primary-color);
  color: rgb(255 255 255 / 96%);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 12%);
}

.rail-menu__label {
  font-size: 12px;
  line-height: 1.2;
  text-align: center;
}
</style>
