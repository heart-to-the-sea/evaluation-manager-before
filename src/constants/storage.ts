export const STORAGE_DICT_CODES = {
  group: 'storage_usage_group',
  type: 'storage_type',
  status: 'storage_status',
  defaultFlag: 'storage_default_flag'
} as const;

export function splitStorageGroups(value?: string | null) {
  if (!value) {
    return [] as string[];
  }

  return [...new Set(
    value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean)
  )];
}

export function joinStorageGroups(values?: string[] | null) {
  if (!values || values.length === 0) {
    return '';
  }

  return [...new Set(values.map(item => item.trim()).filter(Boolean))].join(',');
}
