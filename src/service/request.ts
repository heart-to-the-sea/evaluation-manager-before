import type { ApiResponse, RequestResult } from '@/types/app';
import { useAuthStore } from '@/stores/auth';

interface RequestOptions {
  url: string;
  method?: 'get' | 'post' | 'put' | 'delete';
  params?: Record<string, any>;
  data?: any;
}

interface BlobRequestOptions extends RequestOptions {
  fileName?: string;
}

function buildHeaders() {
  const headers: Record<string, string> = {};
  const authStore = useAuthStore();

  if (authStore.token) {
    headers.Authorization = `Bearer ${authStore.token}`;
    headers.satoken = authStore.token;
  }

  return headers;
}

function normalizeError(error: any) {
  const message =
    error?.data?.msg ||
    error?.data?.message ||
    error?.message ||
    '请求失败，请稍后重试';

  return new Error(message);
}

export async function request<T>(options: RequestOptions): Promise<RequestResult<T>> {
  const config = useRuntimeConfig();

  try {
    const response = await $fetch<ApiResponse<T>>(options.url, {
      baseURL: config.public.apiBase,
      method: options.method || 'get',
      params: options.params,
      body: options.data,
      headers: buildHeaders()
    });

    if (response.code !== '0000') {
      const error = new Error(response.msg || '请求失败');
      window.$message?.error(error.message);
      return {
        data: response.data,
        error,
        code: response.code,
        msg: response.msg
      };
    }

    return {
      data: response.data,
      error: null,
      code: response.code,
      msg: response.msg
    };
  } catch (caughtError: any) {
    const error = normalizeError(caughtError);

    if (caughtError?.status === 401 || caughtError?.statusCode === 401) {
      const authStore = useAuthStore();
      authStore.clearAuth();

      const currentPath = import.meta.client ? window.location.pathname + window.location.search : '/';
      await navigateTo(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }

    window.$message?.error(error.message);

    return {
      data: null as T,
      error,
      code: String(caughtError?.status || caughtError?.statusCode || '500'),
      msg: error.message
    };
  }
}

export async function requestUpload<T>(options: RequestOptions): Promise<RequestResult<T>> {
  const config = useRuntimeConfig();

  try {
    const response = await $fetch<ApiResponse<T>>(options.url, {
      baseURL: config.public.apiBase,
      method: options.method || 'post',
      params: options.params,
      body: options.data,
      headers: buildHeaders()
    });

    if (response.code !== '0000') {
      const error = new Error(response.msg || '请求失败');
      window.$message?.error(error.message);
      return {
        data: response.data,
        error,
        code: response.code,
        msg: response.msg
      };
    }

    return {
      data: response.data,
      error: null,
      code: response.code,
      msg: response.msg
    };
  } catch (caughtError: any) {
    const error = normalizeError(caughtError);
    if (caughtError?.status === 401 || caughtError?.statusCode === 401) {
      const authStore = useAuthStore();
      authStore.clearAuth();
      const currentPath = import.meta.client ? window.location.pathname + window.location.search : '/';
      await navigateTo(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
    window.$message?.error(error.message);
    return {
      data: null as T,
      error,
      code: String(caughtError?.status || caughtError?.statusCode || '500'),
      msg: error.message
    };
  }
}

export async function requestBlob(options: BlobRequestOptions) {
  const config = useRuntimeConfig();

  try {
    const blob = await $fetch.raw(options.url, {
      baseURL: config.public.apiBase,
      method: options.method || 'get',
      params: options.params,
      body: options.data,
      headers: buildHeaders(),
      responseType: 'blob'
    });

    const source = blob._data as Blob;
    const objectUrl = window.URL.createObjectURL(source);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = options.fileName || 'download.xlsx';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(objectUrl);

    return { error: null };
  } catch (caughtError: any) {
    const error = normalizeError(caughtError);
    if (caughtError?.status === 401 || caughtError?.statusCode === 401) {
      const authStore = useAuthStore();
      authStore.clearAuth();
      const currentPath = import.meta.client ? window.location.pathname + window.location.search : '/';
      await navigateTo(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
    window.$message?.error(error.message);
    return { error };
  }
}
