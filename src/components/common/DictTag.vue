<script setup lang="ts">
import { computed } from 'vue';
import { NTag } from 'naive-ui';
import { useDict, type DictTagType } from '@/composables/use-dict';

interface Props {
  dictCode: string;
  value?: string | number | null;
  fallbackLabel?: string | null;
  overrideLabel?: string | null;
  defaultType?: DictTagType;
  customColor?: string | null;
  className?: string | null;
  colorMode?: 'auto' | 'soft' | 'solid';
  bordered?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const props = withDefaults(defineProps<Props>(), {
  value: null,
  fallbackLabel: '',
  overrideLabel: '',
  defaultType: 'default',
  customColor: '',
  className: '',
  colorMode: 'auto',
  bordered: false,
  size: 'small'
});

const { getOption } = useDict(() => props.dictCode);

const option = computed(() => getOption(props.value));
const tagType = computed(() => props.defaultType);
const className = computed(() => props.className || option.value?.raw?.className || '');
const customColor = computed(() => props.customColor || option.value?.raw?.customColor || '');
const text = computed(() => {
  const override = String(props.overrideLabel || '').trim();
  if (override) return override;

  const label = String(option.value?.label || '').trim();
  if (label) return label;

  const fallback = String(props.fallbackLabel || '').trim();
  if (fallback) return fallback;

  if (props.value === null || props.value === undefined || props.value === '') return '-';
  return String(props.value);
});

function parseColor(color?: string | null) {
  if (!color) return null;
  const value = color.trim();
  if (!value) return null;

  const shortHex = /^#([0-9a-f]{3})$/i.exec(value);
  if (shortHex) {
    const [red, green, blue] = shortHex[1].split('');
    return {
      red: parseInt(`${red}${red}`, 16),
      green: parseInt(`${green}${green}`, 16),
      blue: parseInt(`${blue}${blue}`, 16)
    };
  }

  const fullHex = /^#([0-9a-f]{6})$/i.exec(value);
  if (fullHex) {
    return {
      red: parseInt(fullHex[1].slice(0, 2), 16),
      green: parseInt(fullHex[1].slice(2, 4), 16),
      blue: parseInt(fullHex[1].slice(4, 6), 16)
    };
  }

  const rgb = /^rgba?\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})/i.exec(value);
  if (rgb) {
    return {
      red: Math.min(255, Number(rgb[1])),
      green: Math.min(255, Number(rgb[2])),
      blue: Math.min(255, Number(rgb[3]))
    };
  }

  return null;
}

function toRgba(color: NonNullable<ReturnType<typeof parseColor>>, alpha: number) {
  return `rgba(${color.red}, ${color.green}, ${color.blue}, ${alpha})`;
}

function getTextColor(color: NonNullable<ReturnType<typeof parseColor>>) {
  const luminance = (color.red * 299 + color.green * 587 + color.blue * 114) / 1000;
  return luminance < 128 ? '#ffffff' : `rgb(${color.red}, ${color.green}, ${color.blue})`;
}

const customStyle = computed(() => {
  const parsed = parseColor(customColor.value);
  if (!parsed) return undefined;

  const textColor = getTextColor(parsed);
  const useSolid = props.colorMode === 'solid' || (props.colorMode === 'auto' && textColor === '#ffffff');
  const displayTextColor = props.colorMode === 'soft' ? `rgb(${parsed.red}, ${parsed.green}, ${parsed.blue})` : textColor;

  return {
    color: displayTextColor,
    backgroundColor: useSolid ? `rgb(${parsed.red}, ${parsed.green}, ${parsed.blue})` : toRgba(parsed, 0.14),
    boxShadow: `inset 0 0 0 1px ${toRgba(parsed, useSolid ? 0.92 : 0.32)}`
  };
});
</script>

<template>
  <NTag
    :bordered="bordered"
    :size="size"
    :type="tagType"
    :class="['em-dict-tag', className]"
    :style="customStyle"
  >
    {{ text }}
  </NTag>
</template>
