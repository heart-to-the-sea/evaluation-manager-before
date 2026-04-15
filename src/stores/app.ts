export const useAppStore = defineStore('app', {
  state: () => ({
    siderCollapsed: false,
    themeDrawerVisible: false
  }),
  actions: {
    toggleSider() {
      this.siderCollapsed = !this.siderCollapsed;
    },
    setSiderCollapsed(value: boolean) {
      this.siderCollapsed = value;
    },
    openThemeDrawer() {
      this.themeDrawerVisible = true;
    },
    closeThemeDrawer() {
      this.themeDrawerVisible = false;
    }
  }
});
