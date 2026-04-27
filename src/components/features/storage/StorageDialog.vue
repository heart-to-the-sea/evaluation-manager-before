<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { NAlert, NButton, NDivider, NForm, NFormItem, NGrid, NGi, NInput, NModal, NSpace } from 'naive-ui';
import type { FormInst, FormRules } from 'naive-ui';
import DictSelect from '@/components/common/DictSelect.vue';
import { STORAGE_DICT_CODES, joinStorageGroups, splitStorageGroups } from '@/constants/storage';
import { fetchStorageConfigAdd, fetchStorageConfigTestConnection, fetchStorageConfigUpdate } from '@/service/api';
import type { StorageConfigBo, StorageConfigVo } from '@/types/app';

interface Props {
  show: boolean;
  data?: StorageConfigVo | null;
}

interface FormModel {
  id: string;
  name: string;
  storageGroups: string[];
  storageType: string;
  endpoint: string;
  bucketName: string;
  accessKey: string;
  secretKey: string;
  region: string;
  basePath: string;
  publicUrl: string;
  pathPrefix: string;
  status: string;
  defaultFlag: string;
  remark: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [submitted?: boolean];
}>();

const formRef = ref<FormInst | null>(null);
const submitting = ref(false);
const testing = ref(false);
const formData = ref<FormModel>(createDefaultForm());

const isEdit = computed(() => Boolean(props.data?.id));
const isLocal = computed(() => formData.value.storageType === 'LOCAL');

const rules = computed<FormRules>(() => ({
  name: [{ required: true, message: '请输入存储名称', trigger: ['input', 'blur'] }],
  storageGroups: [{ required: true, type: 'array', message: '请选择用途分组', trigger: ['change'] }],
  storageType: [{ required: true, message: '请选择存储类型', trigger: ['change'] }],
  status: [{ required: true, message: '请选择状态', trigger: ['change'] }],
  defaultFlag: [{ required: true, message: '请选择默认配置', trigger: ['change'] }],
  endpoint: isLocal.value ? [] : [{ required: true, message: '请输入访问地址', trigger: ['input', 'blur'] }],
  bucketName: isLocal.value ? [] : [{ required: true, message: '请输入存储桶名称', trigger: ['input', 'blur'] }],
  accessKey: isLocal.value ? [] : [{ required: true, message: '请输入访问密钥', trigger: ['input', 'blur'] }],
  secretKey: isLocal.value ? [] : [{ required: true, message: '请输入私钥', trigger: ['input', 'blur'] }],
  basePath: isLocal.value ? [{ required: true, message: '请输入基础路径', trigger: ['input', 'blur'] }] : []
}));

watch(
  () => props.show,
  visible => {
    if (!visible) {
      return;
    }

    formData.value = createFormData(props.data);
    nextTick(() => {
      formRef.value?.restoreValidation();
    });
  }
);

watch(
  () => formData.value.storageType,
  value => {
    if (value === 'LOCAL') {
      formData.value.endpoint = '';
      formData.value.bucketName = '';
      formData.value.accessKey = '';
      formData.value.secretKey = '';
      formData.value.region = '';
      return;
    }

    formData.value.basePath = '';
  }
);

watch(
  () => formData.value.defaultFlag,
  value => {
    if (value === '1') {
      formData.value.status = '1';
    }
  }
);

function createDefaultForm(): FormModel {
  return {
    id: '',
    name: '',
    storageGroups: [],
    storageType: 'MINIO',
    endpoint: '',
    bucketName: '',
    accessKey: '',
    secretKey: '',
    region: '',
    basePath: '',
    publicUrl: '',
    pathPrefix: '',
    status: '1',
    defaultFlag: '0',
    remark: ''
  };
}

function createFormData(data?: StorageConfigVo | null): FormModel {
  if (!data) {
    return createDefaultForm();
  }

  return {
    id: data.id || '',
    name: data.name || '',
    storageGroups: splitStorageGroups(data.storageGroup),
    storageType: data.storageType || 'MINIO',
    endpoint: data.endpoint || '',
    bucketName: data.bucketName || '',
    accessKey: data.accessKey || '',
    secretKey: data.secretKey || '',
    region: data.region || '',
    basePath: data.basePath || '',
    publicUrl: data.publicUrl || '',
    pathPrefix: data.pathPrefix || '',
    status: data.status === 0 ? '0' : '1',
    defaultFlag: data.defaultFlag ? '1' : '0',
    remark: data.remark || ''
  };
}

function buildPayload(): StorageConfigBo {
  const storageGroup = joinStorageGroups(formData.value.storageGroups);
  return {
    id: formData.value.id || undefined,
    name: formData.value.name.trim(),
    storageGroup: storageGroup || undefined,
    storageType: formData.value.storageType || undefined,
    endpoint: formData.value.endpoint.trim() || undefined,
    bucketName: formData.value.bucketName.trim() || undefined,
    accessKey: formData.value.accessKey.trim() || undefined,
    secretKey: formData.value.secretKey.trim() || undefined,
    region: formData.value.region.trim() || undefined,
    basePath: formData.value.basePath.trim() || undefined,
    publicUrl: formData.value.publicUrl.trim() || undefined,
    pathPrefix: formData.value.pathPrefix.trim() || undefined,
    status: Number(formData.value.status || 1),
    defaultFlag: formData.value.defaultFlag === '1',
    remark: formData.value.remark.trim() || undefined
  };
}

function handleClose() {
  emit('close', false);
}

async function handleTestConnection() {
  testing.value = true;

  try {
    const { error, msg } = await fetchStorageConfigTestConnection(buildPayload());
    if (error) {
      return;
    }

    window.$message?.success(msg || '连接测试成功');
  } finally {
    testing.value = false;
  }
}

async function handleSubmit() {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }

  submitting.value = true;

  try {
    const payload = buildPayload();
    const response = isEdit.value ? await fetchStorageConfigUpdate(payload) : await fetchStorageConfigAdd(payload);
    if (response.error) {
      return;
    }

    window.$message?.success(isEdit.value ? '存储配置更新成功' : '存储配置新增成功');
    emit('close', true);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    :title="isEdit ? '编辑文件存储' : '新增文件存储'"
    :style="{ width: '960px' }"
    :mask-closable="false"
    @update:show="value => !value && handleClose()"
  >
    <div class="storage-dialog">
      <NAlert type="info" :bordered="false">
        支持 MinIO、阿里云 OSS、华为云 OBS、腾讯云 COS 和本地路径存储。
      </NAlert>

      <NForm ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="110" class="storage-form">
        <NGrid :cols="2" :x-gap="16">
          <NGi>
            <NFormItem label="存储名称" path="name">
              <NInput v-model:value="formData.name" placeholder="例如：头像存储" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="用途分组" path="storageGroups">
              <DictSelect
                v-model:model-value="formData.storageGroups"
                :dict-code="STORAGE_DICT_CODES.group"
                multiple
                clearable
                filterable
                max-tag-count="responsive"
                placeholder="请选择用途分组"
              />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="存储类型" path="storageType">
              <DictSelect v-model:model-value="formData.storageType" :dict-code="STORAGE_DICT_CODES.type" placeholder="请选择存储类型" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="状态" path="status">
              <DictSelect v-model:model-value="formData.status" :dict-code="STORAGE_DICT_CODES.status" placeholder="请选择状态" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="默认配置" path="defaultFlag">
              <DictSelect v-model:model-value="formData.defaultFlag" :dict-code="STORAGE_DICT_CODES.defaultFlag" placeholder="请选择默认配置" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="路径前缀" path="pathPrefix">
              <NInput v-model:value="formData.pathPrefix" placeholder="例如：avatar/2026" />
            </NFormItem>
          </NGi>
        </NGrid>

        <NDivider title-placement="left">
          {{ isLocal ? '本地路径配置' : '对象存储配置' }}
        </NDivider>

        <NGrid :cols="2" :x-gap="16">
          <NGi v-if="!isLocal">
            <NFormItem label="访问地址" path="endpoint">
              <NInput v-model:value="formData.endpoint" placeholder="例如：https://oss-cn-beijing.aliyuncs.com" />
            </NFormItem>
          </NGi>
          <NGi v-if="!isLocal">
            <NFormItem label="存储桶名称" path="bucketName">
              <NInput v-model:value="formData.bucketName" placeholder="例如：em-storage" />
            </NFormItem>
          </NGi>
          <NGi v-if="!isLocal">
            <NFormItem label="访问密钥" path="accessKey">
              <NInput v-model:value="formData.accessKey" placeholder="请输入访问密钥" />
            </NFormItem>
          </NGi>
          <NGi v-if="!isLocal">
            <NFormItem label="私钥" path="secretKey">
              <NInput v-model:value="formData.secretKey" type="password" show-password-on="click" placeholder="请输入私钥" />
            </NFormItem>
          </NGi>
          <NGi v-if="!isLocal">
            <NFormItem label="地域" path="region">
              <NInput v-model:value="formData.region" placeholder="例如：cn-beijing" />
            </NFormItem>
          </NGi>
          <NGi v-if="!isLocal">
            <NFormItem label="公网地址" path="publicUrl">
              <NInput v-model:value="formData.publicUrl" placeholder="可选，用于前端展示或 CDN 域名" />
            </NFormItem>
          </NGi>
          <NGi v-if="isLocal">
            <NFormItem label="基础路径" path="basePath">
              <NInput v-model:value="formData.basePath" placeholder="例如：D:/data/uploads 或 /var/data/uploads" />
            </NFormItem>
          </NGi>
          <NGi v-if="isLocal">
            <NFormItem label="公网地址" path="publicUrl">
              <NInput v-model:value="formData.publicUrl" placeholder="可选，本地资源对外访问地址" />
            </NFormItem>
          </NGi>
        </NGrid>

        <NFormItem label="备注" path="remark">
          <NInput v-model:value="formData.remark" type="textarea" :rows="3" placeholder="可补充用途说明、环境信息或访问限制" />
        </NFormItem>
      </NForm>
    </div>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="handleClose">取消</NButton>
        <NButton :loading="testing" @click="handleTestConnection">测试连接</NButton>
        <NButton type="primary" :loading="submitting" @click="handleSubmit">保存</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

