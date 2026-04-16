<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { NSelect } from 'naive-ui';
import { useDict, type DictOption } from '@/composables/use-dict';

interface Props {
  modelValue?: string | string[] | DictOption | DictOption[] | null;
  dictCode: string;
  returnMode?: 'value' | 'option';
  multiple?: boolean;
}

defineOptions({
  inheritAttrs: false
});

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  returnMode: 'value',
  multiple: false
});

const emit = defineEmits<{
  'update:modelValue': [value: string | string[] | DictOption | DictOption[] | null];
}>();

const attrs = useAttrs();
const { options, loading } = useDict(() => props.dictCode);

const selectValue = computed(() => {
  if (props.returnMode === 'value') {
    return props.modelValue as string | string[] | null;
  }

  if (props.multiple) {
    return ((props.modelValue as DictOption[] | null) || []).map(item => item?.value).filter(Boolean);
  }

  return (props.modelValue as DictOption | null)?.value ?? null;
});

function handleUpdate(value: string | string[] | null, option: DictOption | DictOption[] | null) {
  if (props.returnMode === 'value') {
    emit('update:modelValue', value);
    return;
  }

  if (props.multiple) {
    const optionsList = Array.isArray(option) ? option : [];
    emit('update:modelValue', optionsList);
    return;
  }

  emit('update:modelValue', option || null);
}
</script>

<template>
  <NSelect
    v-bind="attrs"
    :value="selectValue"
    :options="options"
    :loading="loading"
    :multiple="multiple"
    label-field="label"
    value-field="value"
    @update:value="handleUpdate"
  />
</template>
