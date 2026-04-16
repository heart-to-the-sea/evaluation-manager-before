import { computed, ref, toValue, watch, type MaybeRefOrGetter } from 'vue';
import { fetchDictValuesListByCode } from '@/service/api';

export interface DictOption {
  label: string;
  value: string;
  raw: {
    id?: string;
    dictId?: string;
    dictCode?: string;
    label?: string;
    value?: string;
    sort?: number;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

const dictOptionsCache = new Map<string, DictOption[]>();
const dictPendingCache = new Map<string, Promise<DictOption[]>>();

async function loadDictOptions(dictCode: string, force = false) {
  if (!dictCode) {
    return [] as DictOption[];
  }

  if (!force && dictOptionsCache.has(dictCode)) {
    return dictOptionsCache.get(dictCode) || [];
  }

  if (!force && dictPendingCache.has(dictCode)) {
    return dictPendingCache.get(dictCode)!;
  }

  const request = fetchDictValuesListByCode(dictCode).then(({ data, error }) => {
    if (error) {
      return [] as DictOption[];
    }

    const options = (data || []).map(item => ({
      label: item.label || item.value || '',
      value: String(item.value || ''),
      raw: item
    }));

    dictOptionsCache.set(dictCode, options);
    dictPendingCache.delete(dictCode);
    return options;
  });

  dictPendingCache.set(dictCode, request);
  return request;
}

export function useDict(dictCode: MaybeRefOrGetter<string | undefined | null>) {
  const options = ref<DictOption[]>([]);
  const loading = ref(false);

  async function refresh(force = false) {
    const code = toValue(dictCode);
    if (!code) {
      options.value = [];
      return;
    }

    loading.value = true;
    try {
      options.value = await loadDictOptions(code, force);
    } finally {
      loading.value = false;
    }
  }

  const optionMap = computed(() => {
    const map = new Map<string, DictOption>();
    options.value.forEach(item => map.set(String(item.value), item));
    return map;
  });

  function getLabel(value?: string | number | null) {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    const item = optionMap.value.get(String(value));
    return item?.label || String(value);
  }

  watch(
    () => toValue(dictCode),
    () => {
      refresh();
    },
    { immediate: true }
  );

  return {
    options,
    loading,
    refresh,
    getLabel,
    optionMap
  };
}
