import type { DictBo, DictValuesVo, DictVo, PageResult } from '@/types/app';
import { request } from '../request';
import * as URL from './url';

export function fetchDictList(params: DictBo) {
  return request<PageResult<DictVo>>({ url: URL.DICT_LIST, method: 'get', params });
}

export function fetchDictAdd(data: DictVo) {
  return request<void>({ url: URL.DICT_ADD, method: 'post', data });
}

export function fetchDictUpdate(data: DictVo) {
  return request<void>({ url: URL.DICT_UPDATE, method: 'put', data });
}

export function fetchDictDelete(id: string | number) {
  return request<void>({ url: URL.DICT_DELETE, method: 'delete', params: { id } });
}

export function fetchDictValuesAdd(data: DictValuesVo | { dictCode: string }) {
  return request<void>({ url: URL.DICT_VALUES_ADD, method: 'post', data });
}

export function fetchDictValuesUpdate(data: DictValuesVo) {
  return request<void>({ url: URL.DICT_VALUES_UPDATE, method: 'put', data });
}

export function fetchDictValuesListByCode(dictCode: string) {
  return request<DictValuesVo[]>({ url: URL.DICT_VALUES_LIST_BY_CODE, method: 'get', params: { dictCode } });
}

export function fetchDictValuesDelete(id: string) {
  return request<void>({ url: URL.DICT_VALUES_DELETE, method: 'delete', params: { id } });
}

export function fetchDictValuesBatchSave(data: DictValuesVo[]) {
  return request<void>({ url: URL.DICT_VALUES_BATCH_SAVE, method: 'post', data });
}
