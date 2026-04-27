import type { PageResult, StorageConfigBo, StorageConfigVo } from '@/types/app';
import { request } from '../request';
import * as URL from './url';

export function fetchStorageConfigList(params: StorageConfigBo) {
  return request<PageResult<StorageConfigVo>>({ url: URL.STORAGE_LIST, method: 'get', params });
}

export function fetchStorageConfigById(id: string) {
  return request<StorageConfigVo>({ url: URL.STORAGE_GET_BY_ID, method: 'get', params: { id } });
}

export function fetchStorageConfigAdd(data: StorageConfigBo) {
  return request<void>({ url: URL.STORAGE_ADD, method: 'post', data });
}

export function fetchStorageConfigUpdate(data: StorageConfigBo) {
  return request<void>({ url: URL.STORAGE_UPDATE, method: 'put', data });
}

export function fetchStorageConfigDelete(id: string) {
  return request<void>({ url: URL.STORAGE_DELETE, method: 'delete', params: { id } });
}

export function fetchStorageConfigTestConnection(data: StorageConfigBo) {
  return request<void>({ url: URL.STORAGE_TEST_CONNECTION, method: 'post', data });
}

export function fetchStorageConfigSetDefault(id: string) {
  return request<void>({ url: URL.STORAGE_SET_DEFAULT, method: 'put', params: { id } });
}

export function fetchStorageConfigOptions(storageGroup?: string) {
  return request<StorageConfigVo[]>({ url: URL.STORAGE_OPTIONS, method: 'get', params: { storageGroup } });
}
