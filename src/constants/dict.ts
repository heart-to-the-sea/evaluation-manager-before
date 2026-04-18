export interface DictColorPresetOption {
  label: string;
  value: string;
}

export const dictColorPresetOptions: DictColorPresetOption[] = [
  { label: '红1', value: '#5c0011' },
  { label: '红2', value: '#820014' },
  { label: '红3', value: '#a8071a' },
  { label: '红4', value: '#cf1322' },
  { label: '红5', value: '#f5222d' },
  { label: '红6', value: '#ff4d4f' },
  { label: '红7', value: '#ff7875' },
  { label: '红8', value: '#ffa39e' },

  { label: '橙1', value: '#612500' },
  { label: '橙2', value: '#873800' },
  { label: '橙3', value: '#ad4e00' },
  { label: '橙4', value: '#d46b08' },
  { label: '橙5', value: '#fa8c16' },
  { label: '橙6', value: '#ffa940' },
  { label: '橙7', value: '#ffc069' },
  { label: '橙8', value: '#ffd591' },

  { label: '黄1', value: '#614700' },
  { label: '黄2', value: '#876800' },
  { label: '黄3', value: '#ad8b00' },
  { label: '黄4', value: '#d4b106' },
  { label: '黄5', value: '#fadb14' },
  { label: '黄6', value: '#ffec3d' },
  { label: '黄7', value: '#fff566' },
  { label: '黄8', value: '#fffb8f' },

  { label: '绿1', value: '#092b00' },
  { label: '绿2', value: '#135200' },
  { label: '绿3', value: '#237804' },
  { label: '绿4', value: '#389e0d' },
  { label: '绿5', value: '#52c41a' },
  { label: '绿6', value: '#73d13d' },
  { label: '绿7', value: '#95de64' },
  { label: '绿8', value: '#b7eb8f' },

  { label: '灰1', value: '#1f1f1f' },
  { label: '灰2', value: '#303133' },
  { label: '灰3', value: '#434343' },
  { label: '灰4', value: '#606266' },
  { label: '灰5', value: '#8c8c8c' },
  { label: '灰6', value: '#bfbfbf' },
  { label: '灰7', value: '#d9d9d9' },
  { label: '灰8', value: '#f0f0f0' }
];

export const dictColorPresetValues = dictColorPresetOptions.map(item => item.value);
