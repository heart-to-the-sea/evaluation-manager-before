import type { FileRecordBo, FileRecordVo, PageResult } from '@/types/app';
import { request, requestBlob, requestUpload } from '../request';
import * as URL from './url';

export function fetchFileRecordList(params: FileRecordBo) {
  return request<PageResult<FileRecordVo>>({ url: URL.FILE_LIST, method: 'get', params });
}

export function fetchFileRecordUpload(data: FormData) {
  return requestUpload<FileRecordVo>({ url: URL.FILE_UPLOAD, method: 'post', data });
}

export function fetchFileRecordDelete(id: string) {
  return request<void>({ url: URL.FILE_DELETE, method: 'delete', params: { id } });
}

export function fetchFileRecordDownload(id: string, fileName?: string) {
  return requestBlob({ url: URL.FILE_DOWNLOAD, method: 'get', params: { id }, fileName });
}
