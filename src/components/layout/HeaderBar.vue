<script setup lang="ts">
import { computed, h } from 'vue';
import { NButton, NDropdown, NIcon, NMenu, NSpace } from 'naive-ui';
import type { MenuOption } from 'naive-ui';
import { ColorPaletteOutline, LogOutOutline, MenuOutline, MoonOutline, SunnyOutline } from '@vicons/ionicons5';
import AppIcon from '@/components/common/AppIcon.vue';
import DarkModeContainer from '@/components/common/DarkModeContainer.vue';
import type { AppMenuOption } from '@/types/app';

interface Props {
  showLogo?: boolean;
  showMenuToggler?: boolean;
  showMenu?: boolean;
  menuOptions?: AppMenuOption[];
  menuSelectedKey?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  showLogo: true,
  showMenuToggler: true,
  showMenu: false,
  menuOptions: () => [],
  menuSelectedKey: null
});

const emit = defineEmits<{
  menuSelect: [key: string];
}>();

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const authStore = useAuthStore();
const themeStore = useThemeStore();
const menuStore = useMenuStore();

const dropdownOptions = [
  { label: '退出登录', key: 'logout', icon: () => h(NIcon, null, { default: () => h(LogOutOutline) }) }
];

const pageTitle = computed(() => String(route.meta.title || '评价管理系统'));
const headerStyle = computed(() => ({
  height: `${themeStore.headerHeight}px`,
  position: themeStore.fixedHeaderAndTab ? 'sticky' : 'relative',
  top: '0',
  zIndex: 30
}));

const headerMenuOptions = computed(() => props.menuOptions.map(mapMenuOption));
const showTitle = computed(() => props.showLogo || !props.showMenu);

function renderIcon(icon?: string) {
  return () => h(AppIcon, { icon, size: 18 });
}

function mapMenuOption(item: AppMenuOption): MenuOption {
  return {
    key: item.key,
    label: item.label,
    icon: item.icon ? renderIcon(item.icon) : undefined,
    children: item.children?.map(mapMenuOption)
  };
}

async function handleSelect(key: string) {
  if (key !== 'logout') {
    return;
  }

  await authStore.logout();
  await router.push('/login');
}

async function goHome() {
  await navigateTo(menuStore.homePath);
}

function openThemeDrawer() {
  appStore.openThemeDrawer();
}

function toggleThemeMode() {
  themeStore.toggleDarkMode();
}
</script>

<template>
  <DarkModeContainer class="header-bar shadow-header" :style="headerStyle">
    <NSpace class="header-left" align="center">
      <NButton v-if="showMenuToggler" quaternary circle @click="appStore.toggleSider()">
        <template #icon>
          <NIcon><MenuOutline /></NIcon>
        </template>
      </NButton>

      <div v-if="showTitle" class="header-title-wrap" @click="goHome">
        <div class="header-title">评价管理系统</div>
        <div v-if="!showMenu" class="header-subtitle">{{ pageTitle }}</div>
      </div>
    </NSpace>

    <div v-if="showMenu" class="header-menu">
      <NMenu
        mode="horizontal"
        :value="menuSelectedKey"
        :options="headerMenuOptions"
        responsive
        @update:value="key => emit('menuSelect', String(key))"
      />
    </div>

    <NSpace class="header-actions" align="center" :size="16">
      <NButton quaternary circle :title="themeStore.darkMode ? '切换亮色' : '切换暗色'" @click="toggleThemeMode">
        <template #icon>
          <NIcon>
            <MoonOutline v-if="themeStore.darkMode" />
            <SunnyOutline v-else />
          </NIcon>
        </template>
      </NButton>

      <NButton quaternary circle @click="openThemeDrawer">
        <template #icon>
          <NIcon><ColorPaletteOutline /></NIcon>
        </template>
      </NButton>

      <NDropdown :options="dropdownOptions" @select="handleSelect">
        <div class="user-box">
          <div class="user-name">{{ authStore.userInfo?.username || '管理员' }}</div>
          <div class="user-role">系统用户</div>
        </div>
      </NDropdown>
    </NSpace>
  </DarkModeContainer>
</template>

<style scoped>
.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-bottom: 1px solid rgb(var(--border-color));
  transition:
    border-color 0.3s ease,
    background-color 0.3s ease,
    color 0.3s ease;
}

.header-left {
  min-width: 0;
  flex: 0 0 auto;
}

.header-title-wrap {
  cursor: pointer;
  white-space: nowrap;
}

.header-title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.2;
}

.header-subtitle {
  margin-top: 2px;
  font-size: 12px;
  color: rgb(var(--muted-text-color));
}

.header-menu {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  padding: 0 24px;
}

.header-menu :deep(.n-menu) {
  width: 100%;
}

.header-menu :deep(.n-menu-item-content) {
  height: calc(var(--em-header-height) - 2px);
}

.header-actions {
  flex: 0 0 auto;
}

.user-box {
  min-width: 88px;
  cursor: pointer;
  text-align: right;
}

.user-name {
  font-weight: 600;
  line-height: 1.2;
}

.user-role {
  font-size: 12px;
  color: rgb(var(--muted-text-color));
}
</style>
