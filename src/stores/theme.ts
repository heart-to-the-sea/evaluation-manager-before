import { getStorage, setStorage } from '@/utils/storage';

const THEME_KEY = 'em-nuxt-theme';

type LayoutMode =
  | 'vertical'
  | 'vertical-mix'
  | 'vertical-hybrid-header-first'
  | 'horizontal'
  | 'top-hybrid-sidebar-first'
  | 'top-hybrid-header-first';

interface ThemeState {
  darkMode: boolean;
  themeColor: string;
  themeRadius: number;
  layoutMode: LayoutMode;
  headerHeight: number;
  tabVisible: boolean;
  tabHeight: number;
  siderWidth: number;
  siderCollapsedWidth: number;
  mixWidth: number;
  mixCollapsedWidth: number;
  mixChildMenuWidth: number;
  siderInverted: boolean;
  fixedHeaderAndTab: boolean;
}

const defaultThemeState: ThemeState = {
  darkMode: false,
  themeColor: '#2080f0',
  themeRadius: 8,
  layoutMode: 'vertical',
  headerHeight: 56,
  tabVisible: true,
  tabHeight: 44,
  siderWidth: 248,
  siderCollapsedWidth: 72,
  mixWidth: 90,
  mixCollapsedWidth: 64,
  mixChildMenuWidth: 200,
  siderInverted: false,
  fixedHeaderAndTab: true
};

function normalizeState(saved: Partial<ThemeState> | null | undefined): ThemeState {
  return {
    ...defaultThemeState,
    ...saved,
    themeRadius: Number(saved?.themeRadius ?? defaultThemeState.themeRadius),
    headerHeight: Number(saved?.headerHeight ?? defaultThemeState.headerHeight),
    tabHeight: Number(saved?.tabHeight ?? defaultThemeState.tabHeight),
    siderWidth: Number(saved?.siderWidth ?? defaultThemeState.siderWidth),
    siderCollapsedWidth: Number(saved?.siderCollapsedWidth ?? defaultThemeState.siderCollapsedWidth),
    mixWidth: Number(saved?.mixWidth ?? defaultThemeState.mixWidth),
    mixCollapsedWidth: Number(saved?.mixCollapsedWidth ?? defaultThemeState.mixCollapsedWidth),
    mixChildMenuWidth: Number(saved?.mixChildMenuWidth ?? defaultThemeState.mixChildMenuWidth)
  };
}

export const useThemeStore = defineStore('theme', {
  state: (): ThemeState => ({
    ...defaultThemeState
  }),
  actions: {
    init() {
      const saved = getStorage<Partial<ThemeState>>(THEME_KEY, defaultThemeState);
      Object.assign(this, normalizeState(saved));
    },
    persist() {
      setStorage(THEME_KEY, {
        darkMode: this.darkMode,
        themeColor: this.themeColor,
        themeRadius: this.themeRadius,
        layoutMode: this.layoutMode,
        headerHeight: this.headerHeight,
        tabVisible: this.tabVisible,
        tabHeight: this.tabHeight,
        siderWidth: this.siderWidth,
        siderCollapsedWidth: this.siderCollapsedWidth,
        mixWidth: this.mixWidth,
        mixCollapsedWidth: this.mixCollapsedWidth,
        mixChildMenuWidth: this.mixChildMenuWidth,
        siderInverted: this.siderInverted,
        fixedHeaderAndTab: this.fixedHeaderAndTab
      });
    },
    resetTheme() {
      Object.assign(this, defaultThemeState);
      this.persist();
    },
    toggleDarkMode() {
      this.darkMode = !this.darkMode;
      this.persist();
    },
    setThemeColor(color: string) {
      this.themeColor = color;
      this.persist();
    },
    setThemeRadius(value: number) {
      this.themeRadius = Math.max(0, Math.min(16, Number(value || defaultThemeState.themeRadius)));
      this.persist();
    },
    setLayoutMode(mode: LayoutMode) {
      this.layoutMode = mode;
      this.persist();
    },
    setHeaderHeight(value: number) {
      this.headerHeight = Math.max(48, Math.min(72, Number(value || defaultThemeState.headerHeight)));
      this.persist();
    },
    setTabVisible(value: boolean) {
      this.tabVisible = value;
      this.persist();
    },
    setTabHeight(value: number) {
      this.tabHeight = Math.max(36, Math.min(56, Number(value || defaultThemeState.tabHeight)));
      this.persist();
    },
    setSiderWidth(value: number) {
      this.siderWidth = Math.max(200, Math.min(320, Number(value || defaultThemeState.siderWidth)));
      this.persist();
    },
    setSiderCollapsedWidth(value: number) {
      this.siderCollapsedWidth = Math.max(56, Math.min(96, Number(value || defaultThemeState.siderCollapsedWidth)));
      this.persist();
    },
    setMixWidth(value: number) {
      this.mixWidth = Math.max(72, Math.min(140, Number(value || defaultThemeState.mixWidth)));
      this.persist();
    },
    setMixCollapsedWidth(value: number) {
      this.mixCollapsedWidth = Math.max(56, Math.min(96, Number(value || defaultThemeState.mixCollapsedWidth)));
      this.persist();
    },
    setMixChildMenuWidth(value: number) {
      this.mixChildMenuWidth = Math.max(160, Math.min(280, Number(value || defaultThemeState.mixChildMenuWidth)));
      this.persist();
    },
    setSiderInverted(value: boolean) {
      this.siderInverted = value;
      this.persist();
    },
    setFixedHeaderAndTab(value: boolean) {
      this.fixedHeaderAndTab = value;
      this.persist();
    }
  }
});
