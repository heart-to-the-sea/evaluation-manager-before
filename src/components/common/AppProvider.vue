<script setup lang="ts">
import { computed, createTextVNode, defineComponent, watch } from 'vue';
import { NConfigProvider, NDialogProvider, NLoadingBarProvider, NMessageProvider, NNotificationProvider, darkTheme, dateZhCN, useDialog, useLoadingBar, useMessage, useNotification, zhCN } from 'naive-ui';

const themeStore = useThemeStore();
themeStore.init();

function hexToRgb(hex: string) {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? value.split('').map(char => char + char).join('') : value;
  const int = Number.parseInt(full, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `${r} ${g} ${b}`;
}

function hexToRgba(hex: string, alpha: number) {
  return `rgba(${hexToRgb(hex).replaceAll(' ', ', ')}, ${alpha})`;
}

function createTintedBorder(hex: string, dark: boolean, strong = false) {
  return `1px solid ${hexToRgba(hex, dark ? (strong ? 0.5 : 0.38) : strong ? 0.34 : 0.22)}`;
}

const themeOverrides = computed(() => {
  const color = themeStore.themeColor;
  const dark = themeStore.darkMode;
  const themeRadius = `${themeStore.themeRadius}px`;
  const cardRadius = `${themeStore.themeRadius + 6}px`;
  const colorRgb = hexToRgb(color).replaceAll(' ', ', ');
  const infoColor = '#2080f0';
  const successColor = '#52c41a';
  const warningColor = '#faad14';
  const errorColor = '#f5222d';
  const containerColor = dark ? 'rgb(28, 28, 28)' : 'rgb(255, 255, 255)';
  const layoutColor = dark ? 'rgb(18, 18, 18)' : 'rgb(247, 250, 252)';
  const baseTextColor = dark ? 'rgb(224, 224, 224)' : 'rgb(31, 31, 31)';
  const mutedTextColor = dark ? 'rgb(166, 166, 166)' : 'rgb(134, 144, 156)';
  const borderColor = dark ? '#3c3c3c' : '#e5e6eb';
  const hoverColor = dark ? 'rgba(255, 255, 255, 0.06)' : '#f7f8fa';
  const pressedColor = dark ? 'rgba(255, 255, 255, 0.1)' : '#f2f3f5';
  const tableHeaderColor = dark ? 'rgb(34, 34, 34)' : 'rgb(250, 251, 252)';
  const tableHeaderHoverColor = dark ? 'rgb(38, 38, 38)' : 'rgb(245, 247, 250)';
  const tableHeaderSortingColor = dark ? 'rgb(42, 42, 42)' : 'rgb(242, 247, 255)';
  const tableRowHoverColor = dark ? 'rgb(36, 36, 36)' : 'rgb(245, 247, 250)';
  const tableRowStripedColor = dark ? 'rgb(31, 31, 31)' : 'rgb(252, 253, 255)';
  const tableRowSortingColor = dark ? 'rgb(40, 40, 40)' : 'rgb(242, 247, 255)';
  const focusShadow = `0 0 0 2px rgba(${colorRgb}, 0.14)`;
  const secondaryColor = dark ? 'rgba(255, 255, 255, 0.08)' : hexToRgba(color, 0.1);
  const secondaryHoverColor = dark ? 'rgba(255, 255, 255, 0.12)' : hexToRgba(color, 0.14);
  const secondaryPressedColor = dark ? 'rgba(255, 255, 255, 0.16)' : hexToRgba(color, 0.18);
  const tertiaryHoverColor = dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(31, 35, 41, 0.06)';
  const tertiaryPressedColor = dark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(31, 35, 41, 0.1)';
  const neutralTagColor = dark ? 'rgba(255, 255, 255, 0.08)' : 'rgb(247, 248, 250)';

  return {
    common: {
      primaryColor: color,
      primaryColorHover: color,
      primaryColorPressed: color,
      primaryColorSuppl: color,
      infoColor,
      infoColorHover: infoColor,
      infoColorPressed: infoColor,
      infoColorSuppl: infoColor,
      successColor,
      successColorHover: successColor,
      successColorPressed: successColor,
      successColorSuppl: successColor,
      warningColor,
      warningColorHover: warningColor,
      warningColorPressed: warningColor,
      warningColorSuppl: warningColor,
      errorColor,
      errorColorHover: errorColor,
      errorColorPressed: errorColor,
      errorColorSuppl: errorColor,
      bodyColor: layoutColor,
      cardColor: containerColor,
      modalColor: containerColor,
      popoverColor: containerColor,
      tableColor: containerColor,
      textColorBase: baseTextColor,
      textColor1: baseTextColor,
      textColor2: baseTextColor,
      textColor3: mutedTextColor,
      borderColor,
      dividerColor: borderColor,
      borderRadius: themeRadius
    },
    Button: {
      borderRadiusTiny: `${Math.max(themeStore.themeRadius - 2, 4)}px`,
      borderRadiusSmall: `${Math.max(themeStore.themeRadius - 2, 4)}px`,
      borderRadiusMedium: themeRadius,
      borderRadiusLarge: themeRadius,
      fontWeight: '500',
      heightTiny: '24px',
      heightSmall: '28px',
      heightMedium: '34px',
      heightLarge: '40px',
      paddingTiny: '0 10px',
      paddingSmall: '0 12px',
      paddingMedium: '0 16px',
      paddingLarge: '0 18px',
      color: containerColor,
      colorHover: hoverColor,
      colorPressed: pressedColor,
      textColor: baseTextColor,
      textColorTertiary: baseTextColor,
      textColorHover: baseTextColor,
      textColorPressed: baseTextColor,
      textColorText: baseTextColor,
      textColorTextHover: color,
      textColorTextPressed: color,
      textColorGhost: baseTextColor,
      textColorGhostHover: color,
      textColorGhostPressed: color,
      border: `1px solid ${borderColor}`,
      borderHover: `1px solid ${dark ? '#5a5a5a' : '#c9cdd4'}`,
      borderPressed: `1px solid ${dark ? '#737373' : '#bfc4cd'}`,
      borderFocus: `1px solid ${color}`,
      colorSecondary: secondaryColor,
      colorSecondaryHover: secondaryHoverColor,
      colorSecondaryPressed: secondaryPressedColor,
      colorTertiary: 'transparent',
      colorTertiaryHover: tertiaryHoverColor,
      colorTertiaryPressed: tertiaryPressedColor,
      colorQuaternary: 'transparent',
      colorQuaternaryHover: tertiaryHoverColor,
      colorQuaternaryPressed: tertiaryPressedColor,
      boxShadowHover: dark ? '0 1px 2px rgba(0, 0, 0, 0.18)' : '0 1px 2px rgba(31, 35, 41, 0.06)',
      boxShadowFocus: focusShadow,
      boxShadowPressed: 'none',
      colorPrimary: color,
      colorHoverPrimary: color,
      colorPressedPrimary: color,
      colorFocusPrimary: color,
      borderPrimary: createTintedBorder(color, dark, true),
      borderHoverPrimary: createTintedBorder(color, dark, true),
      borderPressedPrimary: createTintedBorder(color, dark, true),
      borderFocusPrimary: createTintedBorder(color, dark, true),
      textColorPrimary: '#ffffff',
      textColorHoverPrimary: '#ffffff',
      textColorPressedPrimary: '#ffffff',
      textColorFocusPrimary: '#ffffff',
      textColorTextPrimary: color,
      textColorTextHoverPrimary: color,
      textColorTextPressedPrimary: color,
      textColorGhostPrimary: color,
      textColorGhostHoverPrimary: color,
      textColorGhostPressedPrimary: color,
      borderInfo: createTintedBorder(infoColor, dark, true),
      borderHoverInfo: createTintedBorder(infoColor, dark, true),
      borderPressedInfo: createTintedBorder(infoColor, dark, true),
      borderFocusInfo: createTintedBorder(infoColor, dark, true),
      textColorGhostInfo: infoColor,
      textColorGhostHoverInfo: infoColor,
      textColorGhostPressedInfo: infoColor,
      textColorTextInfo: infoColor,
      textColorTextHoverInfo: infoColor,
      textColorTextPressedInfo: infoColor,
      borderSuccess: createTintedBorder(successColor, dark, true),
      borderHoverSuccess: createTintedBorder(successColor, dark, true),
      borderPressedSuccess: createTintedBorder(successColor, dark, true),
      borderFocusSuccess: createTintedBorder(successColor, dark, true),
      textColorGhostSuccess: successColor,
      textColorGhostHoverSuccess: successColor,
      textColorGhostPressedSuccess: successColor,
      textColorTextSuccess: successColor,
      textColorTextHoverSuccess: successColor,
      textColorTextPressedSuccess: successColor,
      borderWarning: createTintedBorder(warningColor, dark, true),
      borderHoverWarning: createTintedBorder(warningColor, dark, true),
      borderPressedWarning: createTintedBorder(warningColor, dark, true),
      borderFocusWarning: createTintedBorder(warningColor, dark, true),
      textColorGhostWarning: warningColor,
      textColorGhostHoverWarning: warningColor,
      textColorGhostPressedWarning: warningColor,
      textColorTextWarning: warningColor,
      textColorTextHoverWarning: warningColor,
      textColorTextPressedWarning: warningColor,
      borderError: createTintedBorder(errorColor, dark, true),
      borderHoverError: createTintedBorder(errorColor, dark, true),
      borderPressedError: createTintedBorder(errorColor, dark, true),
      borderFocusError: createTintedBorder(errorColor, dark, true),
      textColorGhostError: errorColor,
      textColorGhostHoverError: errorColor,
      textColorGhostPressedError: errorColor,
      textColorTextError: errorColor,
      textColorTextHoverError: errorColor,
      textColorTextPressedError: errorColor
    },
    Input: {
      borderRadius: themeRadius,
      heightMedium: '34px',
      color: containerColor,
      colorFocus: containerColor,
      textColor: baseTextColor,
      placeholderColor: mutedTextColor,
      border: `1px solid ${borderColor}`,
      borderHover: `1px solid ${dark ? '#5a5a5a' : '#c9cdd4'}`,
      borderFocus: `1px solid ${color}`,
      boxShadowFocus: focusShadow
    },
    Select: {
      peers: {
        InternalSelection: {
          borderRadius: themeRadius,
          heightMedium: '34px',
          color: containerColor,
          colorActive: containerColor,
          textColor: baseTextColor,
          placeholderColor: mutedTextColor,
          border: `1px solid ${borderColor}`,
          borderHover: `1px solid ${dark ? '#5a5a5a' : '#c9cdd4'}`,
          borderFocus: `1px solid ${color}`,
          boxShadowActive: focusShadow
        }
      }
    },
    Card: {
      color: containerColor,
      borderRadius: cardRadius,
      paddingMedium: '16px',
      paddingLarge: '18px'
    },
    DataTable: {
      borderRadius: '12px',
      borderColor,
      thColor: tableHeaderColor,
      thColorHover: tableHeaderHoverColor,
      thColorSorting: tableHeaderSortingColor,
      tdColor: containerColor,
      tdColorHover: tableRowHoverColor,
      tdColorStriped: tableRowStripedColor,
      tdColorSorting: tableRowSortingColor,
      boxShadowBefore: dark ? 'inset -12px 0 8px -12px rgba(0, 0, 0, 0.42)' : 'inset -12px 0 8px -12px rgba(15, 23, 42, 0.16)',
      boxShadowAfter: dark ? 'inset 12px 0 8px -12px rgba(0, 0, 0, 0.42)' : 'inset 12px 0 8px -12px rgba(15, 23, 42, 0.16)',
      tdTextColor: baseTextColor,
      thTextColor: baseTextColor,
      thFontWeight: '600',
      thPaddingMedium: '12px 16px',
      tdPaddingMedium: '12px 16px',
      paginationMargin: '16px 0 0 0'
    },
    Pagination: {
      buttonColor: containerColor,
      buttonColorHover: hoverColor,
      buttonColorPressed: pressedColor,
      buttonBorder: `1px solid ${borderColor}`,
      buttonBorderHover: `1px solid ${dark ? '#5a5a5a' : '#c9cdd4'}`,
      buttonBorderPressed: `1px solid ${dark ? '#737373' : '#bfc4cd'}`,
      buttonIconColor: mutedTextColor,
      buttonIconColorHover: color,
      buttonIconColorPressed: color,
      itemColor: containerColor,
      itemColorHover: hoverColor,
      itemColorPressed: pressedColor,
      itemColorActive: hexToRgba(color, dark ? 0.22 : 0.1),
      itemColorActiveHover: hexToRgba(color, dark ? 0.26 : 0.14),
      itemTextColor: baseTextColor,
      itemTextColorHover: color,
      itemTextColorPressed: color,
      itemTextColorActive: color,
      itemBorder: `1px solid ${borderColor}`,
      itemBorderHover: `1px solid ${dark ? '#5a5a5a' : '#c9cdd4'}`,
      itemBorderPressed: `1px solid ${dark ? '#737373' : '#bfc4cd'}`,
      itemBorderActive: `1px solid ${hexToRgba(color, dark ? 0.32 : 0.2)}`,
      itemBorderRadius: '8px'
    },
    Tag: {
      borderRadius: '6px',
      heightSmall: '22px',
      heightMedium: '24px',
      fontWeightStrong: '500',
      padding: '0 8px',
      border: `1px solid ${dark ? '#4a4a4a' : '#e5e6eb'}`,
      color: neutralTagColor,
      colorBordered: neutralTagColor,
      textColor: baseTextColor,
      borderPrimary: createTintedBorder(color, dark),
      textColorPrimary: color,
      colorPrimary: hexToRgba(color, dark ? 0.22 : 0.12),
      colorBorderedPrimary: hexToRgba(color, dark ? 0.22 : 0.12),
      borderInfo: createTintedBorder(infoColor, dark),
      textColorInfo: infoColor,
      colorInfo: hexToRgba(infoColor, dark ? 0.22 : 0.12),
      colorBorderedInfo: hexToRgba(infoColor, dark ? 0.22 : 0.12),
      borderSuccess: createTintedBorder(successColor, dark),
      textColorSuccess: successColor,
      colorSuccess: hexToRgba(successColor, dark ? 0.22 : 0.12),
      colorBorderedSuccess: hexToRgba(successColor, dark ? 0.22 : 0.12),
      borderWarning: createTintedBorder(warningColor, dark),
      textColorWarning: warningColor,
      colorWarning: hexToRgba(warningColor, dark ? 0.22 : 0.12),
      colorBorderedWarning: hexToRgba(warningColor, dark ? 0.22 : 0.12),
      borderError: createTintedBorder(errorColor, dark),
      textColorError: errorColor,
      colorError: hexToRgba(errorColor, dark ? 0.22 : 0.12),
      colorBorderedError: hexToRgba(errorColor, dark ? 0.22 : 0.12)
    },
    Drawer: {
      color: containerColor,
      textColor: baseTextColor,
      titleTextColor: baseTextColor,
      borderRadius: '16px 0 0 16px',
      headerPadding: '18px 20px',
      bodyPadding: '16px 20px',
      footerPadding: '16px 20px',
      boxShadow: dark ? '0 12px 32px rgba(0, 0, 0, 0.4)' : '0 12px 32px rgba(15, 23, 42, 0.16)',
      headerBorderBottom: `1px solid ${borderColor}`,
      footerBorderTop: `1px solid ${borderColor}`
    },
    Modal: {
      color: containerColor,
      textColor: baseTextColor,
      boxShadow: dark ? '0 18px 48px rgba(0, 0, 0, 0.38)' : '0 18px 48px rgba(15, 23, 42, 0.16)'
    }
  };
});

const ContextHolder = defineComponent({
  name: 'ContextHolder',
  setup() {
    window.$loadingBar = useLoadingBar();
    window.$dialog = useDialog();
    window.$message = useMessage();
    window.$notification = useNotification();

    return () => createTextVNode();
  }
});

watch(
  () => themeStore.darkMode,
  value => {
    if (import.meta.client) {
      document.documentElement.classList.toggle('dark', value);
    }
  },
  { immediate: true }
);

watch(
  () => themeStore.themeColor,
  value => {
    if (import.meta.client) {
      document.documentElement.style.setProperty('--em-primary-color', value);
      document.documentElement.style.setProperty('--em-primary-color-rgb', hexToRgb(value));
    }
  },
  { immediate: true }
);

watch(
  () => [themeStore.themeRadius, themeStore.headerHeight, themeStore.tabHeight],
  ([themeRadius, headerHeight, tabHeight]) => {
    if (import.meta.client) {
      document.documentElement.style.setProperty('--em-theme-radius', `${themeRadius}px`);
      document.documentElement.style.setProperty('--em-header-height', `${headerHeight}px`);
      document.documentElement.style.setProperty('--em-tab-height', `${tabHeight}px`);
    }
  },
  { immediate: true }
);
</script>

<template>
  <NConfigProvider
    :locale="zhCN"
    :date-locale="dateZhCN"
    :theme="themeStore.darkMode ? darkTheme : undefined"
    :theme-overrides="themeOverrides"
  >
    <NLoadingBarProvider>
      <NDialogProvider>
        <NNotificationProvider>
          <NMessageProvider>
            <ContextHolder />
            <slot />
          </NMessageProvider>
        </NNotificationProvider>
      </NDialogProvider>
    </NLoadingBarProvider>
  </NConfigProvider>
</template>
