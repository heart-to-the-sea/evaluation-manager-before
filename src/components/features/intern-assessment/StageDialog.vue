<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { ContractOutline, ExpandOutline } from '@vicons/ionicons5';
import {
  NButton,
  NColorPicker,
  NDynamicInput,
  NForm,
  NFormItem,
  NGrid,
  NGi,
  NIcon,
  NInput,
  NInputNumber,
  NModal,
  NSwitch,
  NSpin,
  NTag
} from 'naive-ui';
import type { FormInst, FormRules } from 'naive-ui';
import DictSelect from '@/components/common/DictSelect.vue';
import MarkdownEditor from '@/components/common/MarkdownEditor.vue';
import { dictColorPresetValues } from '@/constants/dict';
import { fetchAssessmentStageAdd, fetchAssessmentStageUpdate, fetchFileRecordUpload, fetchStorageConfigOptions } from '@/service/api';
import type { AssessmentStageBo, AssessmentStageVo } from '@/types/app';

interface Props {
  show: boolean;
  data?: AssessmentStageVo | null;
}

type MarkdownField = 'description' | 'passRemark';

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [submitted?: boolean];
}>();

const formRef = ref<FormInst | null>(null);
const submitting = ref(false);
const fullscreen = ref(false);
const activeMarkdownField = ref<MarkdownField>('description');
const materialUploadingMap = reactive<Record<number, boolean>>({});
const materialFileInputRefs = ref<Record<number, HTMLInputElement | null>>({});
const isEdit = computed(() => Boolean(props.data?.id));

const formData = ref<AssessmentStageBo>(createDefaultForm());

const markdownFieldMeta: Record<MarkdownField, { title: string; placeholder: string; hint: string }> = {
  description: {
    title: '阶段说明',
    placeholder: '请输入阶段说明，支持 Markdown',
    hint: '用于说明当前阶段的培训目标、学习内容和完成要求。'
  },
  passRemark: {
    title: '通过说明',
    placeholder: '请输入通过说明，支持 Markdown',
    hint: '用于说明阶段通过标准、注意事项和补充要求。'
  }
};

const currentMarkdownMeta = computed(() => markdownFieldMeta[activeMarkdownField.value]);
const modalStyle = computed(() =>
  fullscreen.value
    ? {
        width: 'calc(100vw - 24px)',
        maxWidth: 'calc(100vw - 24px)',
        height: 'calc(100vh - 24px)',
        maxHeight: 'calc(100vh - 24px)'
      }
    : {
        width: '1180px',
        maxWidth: 'calc(100vw - 32px)',
        maxHeight: 'calc(100vh - 32px)'
      }
);
const currentMarkdownValue = computed({
  get: () => formData.value[activeMarkdownField.value] || '',
  set: value => {
    formData.value[activeMarkdownField.value] = value;
  }
});

const rules: FormRules = {
  code: [{ required: true, message: '请输入阶段编码', trigger: ['input', 'blur'] }],
  name: [{ required: true, message: '请输入阶段名称', trigger: ['input', 'blur'] }],
  status: [{ required: true, message: '请选择状态', trigger: ['change'] }],
  maxStudyDays: [
    {
      trigger: ['change', 'blur'],
      validator: () => {
        if (
          formData.value.minStudyDays != null &&
          formData.value.maxStudyDays != null &&
          formData.value.minStudyDays > formData.value.maxStudyDays
        ) {
          return new Error('最大学习天数不能小于最小学习天数');
        }
        return true;
      }
    }
  ]
};

watch(
  () => props.show,
  visible => {
    if (visible) {
      formData.value = createFormData(props.data);
      activeMarkdownField.value = resolveInitialMarkdownField(formData.value);
      formRef.value?.restoreValidation();
    } else {
      fullscreen.value = false;
    }
  }
);

function resolveInitialMarkdownField(data: AssessmentStageBo): MarkdownField {
  if (String(data.description || '').trim()) {
    return 'description';
  }
  if (String(data.passRemark || '').trim()) {
    return 'passRemark';
  }
  return 'description';
}

function setActiveMarkdownField(field: MarkdownField) {
  activeMarkdownField.value = field;
}

function toggleFullscreen() {
  fullscreen.value = !fullscreen.value;
}

function resolveInputNumberValue(value?: number | string) {
  if (value === '' || value == null) {
    return null;
  }
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : null;
}

function createDefaultForm(): AssessmentStageBo {
  return {
    id: undefined,
    code: '',
    name: '',
    description: '',
    remark: '',
    stageColor: '',
    achievementRequired: false,
    sort: 0,
    status: '1',
    minStudyDays: undefined,
    maxStudyDays: undefined,
    passScore: undefined,
    passRemark: '',
    materials: [],
    rules: []
  };
}

function createFormData(data?: AssessmentStageVo | null): AssessmentStageBo {
  if (!data) {
    return createDefaultForm();
  }

  return {
    id: data.id,
    code: data.code || '',
    name: data.name || '',
    description: data.description || '',
    remark: data.remark || '',
    stageColor: data.stageColor || '',
    achievementRequired: Boolean(data.achievementRequired),
    sort: data.sort ?? 0,
    status: data.status || '1',
    minStudyDays: data.minStudyDays ?? undefined,
    maxStudyDays: data.maxStudyDays ?? undefined,
    passScore: data.passScore ?? undefined,
    passRemark: data.passRemark || '',
    materials: (data.materials || []).map(item => ({
      id: item.id,
      stageId: item.stageId,
      title: item.title || '',
      materialType: item.materialType || '',
      materialUrl: item.materialUrl || '',
      sort: item.sort ?? 0,
      remark: item.remark || ''
    })),
    rules: (data.rules || []).map(item => ({
      id: item.id,
      stageId: item.stageId,
      questionType: item.questionType || '',
      difficulty: item.difficulty || '',
      knowledgePoints: item.knowledgePoints || '',
      questionCount: item.questionCount ?? 0,
      score: item.score ?? undefined,
      sort: item.sort ?? 0
    }))
  };
}

function handleClose() {
  emit('close', false);
}

function handleAddMaterial() {
  formData.value.materials = [...(formData.value.materials || []), createMaterialItem()];
}

function handleAddRule() {
  formData.value.rules = [...(formData.value.rules || []), createRuleItem()];
}

function createMaterialItem() {
  return {
    title: '',
    materialType: '',
    materialUrl: '',
    sort: (formData.value.materials?.length || 0) + 1,
    remark: ''
  };
}

function createRuleItem() {
  return {
    questionType: '',
    difficulty: '',
    knowledgePoints: '',
    questionCount: 1,
    score: 0,
    sort: (formData.value.rules?.length || 0) + 1
  };
}

function setMaterialFileInputRef(index: number, el: HTMLInputElement | null) {
  materialFileInputRefs.value[index] = el;
}

function openMaterialUpload(index: number) {
  materialFileInputRefs.value[index]?.click();
}

async function handleMaterialFileChange(index: number, event: Event) {
  const input = event.target as HTMLInputElement | null;
  const file = input?.files?.[0];
  if (!file) {
    resetMaterialFileInput(index);
    return;
  }

  materialUploadingMap[index] = true;
  try {
    const storageConfigId = await resolveMaterialStorageConfigId();
    if (!storageConfigId) {
      window.$message?.error('未找到可用的文件存储配置');
      return;
    }

    const form = new FormData();
    form.append('file', file);
    form.append('storageGroup', 'attachment');
    form.append('storageConfigId', storageConfigId);
    form.append('remark', '培训阶段学习资料上传');

    const { data, error, msg } = await fetchFileRecordUpload(form);
    if (error) {
      return;
    }

    const material = formData.value.materials?.[index];
    if (!material) {
      return;
    }

    material.materialUrl = String(data?.fileUrl || '').trim();
    if (!material.materialUrl) {
      window.$message?.error('上传成功，但未返回可访问地址，请检查文件存储配置');
      return;
    }
    if (!material.title?.trim()) {
      material.title = stripFileExtension(file.name);
    }
    if (!material.materialType?.trim()) {
      material.materialType = resolveMaterialTypeByFile(file.name, file.type);
    }

    window.$message?.success(msg || '资料上传成功');
  } finally {
    materialUploadingMap[index] = false;
    resetMaterialFileInput(index);
  }
}

async function resolveMaterialStorageConfigId() {
  const { data, error } = await fetchStorageConfigOptions('attachment');
  if (!error && data?.length) {
    const preferred = data.find(item => item.defaultFlag) || data[0];
    if (preferred?.id) return preferred.id;
  }

  const fallback = await fetchStorageConfigOptions();
  if (!fallback.error && fallback.data?.length) {
    const preferred = fallback.data.find(item => item.defaultFlag) || fallback.data[0];
    return preferred?.id || '';
  }

  return '';
}

function resolveMaterialTypeByFile(fileName: string, mimeType?: string) {
  const lowerName = fileName.toLowerCase();
  const lowerType = String(mimeType || '').toLowerCase();
  if (lowerType.startsWith('video/') || /\.(mp4|avi|mov|mkv|webm)$/i.test(lowerName)) return '视频';
  if (lowerType.startsWith('audio/') || /\.(mp3|wav|aac|m4a|flac)$/i.test(lowerName)) return '音频';
  if (/\.(ppt|pptx)$/i.test(lowerName)) return '课件';
  if (/\.(pdf|doc|docx|xls|xlsx|txt|md)$/i.test(lowerName)) return '文档';
  if (lowerType.startsWith('image/')) return '图片';
  return '资料';
}

function stripFileExtension(fileName: string) {
  return fileName.replace(/\.[^.]+$/, '').trim() || fileName;
}

function resetMaterialFileInput(index: number) {
  const input = materialFileInputRefs.value[index];
  if (input) {
    input.value = '';
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
    const payload: AssessmentStageBo = {
      ...formData.value,
      code: formData.value.code?.trim(),
      name: formData.value.name?.trim(),
      description: formData.value.description?.trim() || undefined,
      remark: formData.value.remark?.trim() || undefined,
      stageColor: formData.value.stageColor?.trim() || undefined,
      achievementRequired: Boolean(formData.value.achievementRequired),
      passRemark: formData.value.passRemark?.trim() || undefined,
      materials: (formData.value.materials || [])
        .filter(item => item.title || item.materialUrl)
        .map((item, index) => ({
          ...item,
          title: item.title?.trim(),
          materialType: item.materialType?.trim() || undefined,
          materialUrl: item.materialUrl?.trim() || undefined,
          remark: item.remark?.trim() || undefined,
          sort: item.sort ?? index + 1
        })),
      rules: (formData.value.rules || [])
        .filter(item => item.questionType && item.questionCount)
        .map((item, index) => ({
          ...item,
          knowledgePoints: item.knowledgePoints?.trim() || undefined,
          sort: item.sort ?? index + 1
        }))
    };

    const { error } = isEdit.value ? await fetchAssessmentStageUpdate(payload) : await fetchAssessmentStageAdd(payload);
    if (error) {
      return;
    }

    window.$message?.success(isEdit.value ? '阶段更新成功' : '阶段新增成功');
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
    :class="['stage-dialog-modal', fullscreen && 'stage-dialog-modal--fullscreen']"
    :title="isEdit ? '编辑阶段' : '新增阶段'"
    :style="modalStyle"
    :mask-closable="false"
    @update:show="value => !value && handleClose()"
  >
    <NSpin :show="submitting" class="stage-dialog-spin">
      <div class="stage-dialog-body">
        <div class="stage-dialog-toolbar">
          <div class="stage-dialog-toolbar__title">{{ isEdit ? '编辑阶段' : '新增阶段' }}</div>
          <div class="stage-dialog-toolbar__actions">
            <NButton quaternary circle size="small" :title="fullscreen ? '退出全屏' : '最大化'" @click="toggleFullscreen">
              <template #icon>
                <NIcon size="16">
                  <ContractOutline v-if="fullscreen" />
                  <ExpandOutline v-else />
                </NIcon>
              </template>
            </NButton>
          </div>
        </div>
        <NForm ref="formRef" class="stage-dialog-form" :model="formData" :rules="rules" label-placement="left" label-width="108">
          <div class="stage-dialog-main">
            <section class="stage-dialog-side">
              <div class="stage-dialog-side__card">
                <NGrid :cols="1" :x-gap="12">
                  <NGi span="2">
                    <NFormItem label="阶段编码" path="code">
                      <NInput v-model:value="formData.code" placeholder="请输入阶段编码" />
                    </NFormItem>
                  </NGi>
                  <NGi span="2">
                    <NFormItem label="阶段名称" path="name">
                      <NInput v-model:value="formData.name" placeholder="请输入阶段名称" />
                    </NFormItem>
                  </NGi>
                  <NGi>
                    <NFormItem label="状态" path="status">
                      <DictSelect v-model:model-value="formData.status" dict-code="assessment_enable_status" placeholder="请选择状态" />
                    </NFormItem>
                  </NGi>
                  <NGi>
                    <NFormItem label="阶段颜色" path="stageColor">
                      <NColorPicker
                        :value="formData.stageColor || null"
                        class="stage-color-picker"
                        :modes="['hex']"
                        :show-alpha="false"
                        :actions="['confirm', 'clear']"
                        :swatches="dictColorPresetValues"
                        @update:value="value => (formData.stageColor = value || '')"
                      />
                    </NFormItem>
                  </NGi>
                  <NGi>
                    <NFormItem label="成果必传" path="achievementRequired">
                      <NSwitch v-model:value="formData.achievementRequired">
                        <template #checked>必传</template>
                        <template #unchecked>非必传</template>
                      </NSwitch>
                    </NFormItem>
                  </NGi>
                  <NGi>
                    <NFormItem label="排序" path="sort">
                      <NInputNumber v-model:value="formData.sort" :min="0" style="width: 100%" />
                    </NFormItem>
                  </NGi>
                  <NGi>
                    <NFormItem label="通过分数" path="passScore">
                      <NInputNumber
                        :value="resolveInputNumberValue(formData.passScore)"
                        :min="0"
                        clearable
                        style="width: 100%"
                        @update:value="value => (formData.passScore = value ?? undefined)"
                      />
                    </NFormItem>
                  </NGi>
                  <NGi>
                    <NFormItem label="最小学天数" path="minStudyDays">
                      <NInputNumber v-model:value="formData.minStudyDays" :min="0" clearable style="width: 100%" placeholder="例如 2" />
                    </NFormItem>
                  </NGi>
                  <NGi>
                    <NFormItem label="最大学天数" path="maxStudyDays">
                      <NInputNumber v-model:value="formData.maxStudyDays" :min="0" clearable style="width: 100%" placeholder="例如 5" />
                    </NFormItem>
                  </NGi>
                  <NGi>
                    <NFormItem label="备注" path="remark">
                      <NInput
                        v-model:value="formData.remark"
                        type="textarea"
                        :rows="3"
                        placeholder="请输入阶段备注"
                      />
                    </NFormItem>
                  </NGi>
                </NGrid>

                <div class="stage-markdown-switcher">
                  <button
                    type="button"
                    class="stage-markdown-switcher__item"
                    :class="{ 'stage-markdown-switcher__item--active': activeMarkdownField === 'description' }"
                    @click="setActiveMarkdownField('description')"
                  >
                    <span class="stage-markdown-switcher__title">编辑阶段说明</span>
                    <span class="stage-markdown-switcher__meta">{{ formData.description?.trim() ? '已填写' : '未填写' }}</span>
                  </button>
                  <button
                    type="button"
                    class="stage-markdown-switcher__item"
                    :class="{ 'stage-markdown-switcher__item--active': activeMarkdownField === 'passRemark' }"
                    @click="setActiveMarkdownField('passRemark')"
                  >
                    <span class="stage-markdown-switcher__title">编辑通过说明</span>
                    <span class="stage-markdown-switcher__meta">{{ formData.passRemark?.trim() ? '已填写' : '未填写' }}</span>
                  </button>
                </div>
              </div>
            </section>

            <section class="stage-dialog-editor">
              <div class="stage-dialog-editor__header">
                <div>
                  <div class="stage-dialog-editor__title">{{ currentMarkdownMeta.title }}</div>
                  <div class="stage-dialog-editor__hint">{{ currentMarkdownMeta.hint }}</div>
                </div>
                <NTag size="small" :bordered="false" type="primary">Markdown</NTag>
              </div>
              <MarkdownEditor
                v-model:value="currentMarkdownValue"
                class="stage-dialog-editor__body"
                :placeholder="currentMarkdownMeta.placeholder"
              />
            </section>
          </div>

          <div class="stage-dialog-extra">
          <div class="section-header">
            <div class="section-header__title">学习资料</div>
            <NButton text type="primary" @click="handleAddMaterial">新增资料</NButton>
          </div>
          <NDynamicInput v-model:value="formData.materials" :min="0" :on-create="createMaterialItem">
            <template #default="{ value, index }">
              <NGrid :cols="24" :x-gap="12" class="mb-8px w-full">
                <NGi span="5"><NInput v-model:value="value.title" placeholder="资料标题" /></NGi>
                <NGi span="4"><NInput v-model:value="value.materialType" placeholder="资料类型" /></NGi>
                <NGi span="8">
                  <NInput v-model:value="value.materialUrl" placeholder="资料地址">
                    <template #suffix>
                      <div class="material-upload-actions">
                        <input
                          :ref="el => setMaterialFileInputRef(index, el as HTMLInputElement | null)"
                          type="file"
                          class="material-upload-actions__input"
                          @change="event => handleMaterialFileChange(index, event)"
                        />
                        <NButton
                          text
                          type="primary"
                          size="small"
                          :loading="Boolean(materialUploadingMap[index])"
                          @click="openMaterialUpload(index)"
                        >
                          上传文件
                        </NButton>
                      </div>
                    </template>
                  </NInput>
                </NGi>
                <NGi span="3"><NInputNumber v-model:value="value.sort" :min="0" style="width: 100%" placeholder="排序" /></NGi>
                <NGi span="4"><NInput v-model:value="value.remark" placeholder="备注" /></NGi>
              </NGrid>
            </template>
          </NDynamicInput>

          <div class="section-header section-header--gap">
            <div class="section-header__title">抽题规则</div>
            <NButton text type="primary" @click="handleAddRule">新增规则</NButton>
          </div>
          <NDynamicInput v-model:value="formData.rules" :min="0" :on-create="createRuleItem">
            <template #default="{ value }">
              <NGrid :cols="24" :x-gap="12" class="mb-8px w-full">
                <NGi span="4">
                  <DictSelect v-model:model-value="value.questionType" dict-code="assessment_question_type" placeholder="题型" />
                </NGi>
                <NGi span="4">
                  <DictSelect v-model:model-value="value.difficulty" dict-code="assessment_question_difficulty" clearable placeholder="难度" />
                </NGi>
                <NGi span="7"><NInput v-model:value="value.knowledgePoints" placeholder="知识点，逗号分隔" /></NGi>
                <NGi span="3"><NInputNumber v-model:value="value.questionCount" :min="1" style="width: 100%" placeholder="题数" /></NGi>
                <NGi span="3"><NInputNumber v-model:value="value.score" :min="0" style="width: 100%" placeholder="分值" /></NGi>
                <NGi span="3"><NInputNumber v-model:value="value.sort" :min="0" style="width: 100%" placeholder="排序" /></NGi>
              </NGrid>
            </template>
          </NDynamicInput>
          </div>
        </NForm>
      </div>
    </NSpin>

    <template #action>
      <div class="em-dialog-actions">
        <NButton @click="handleClose">取消</NButton>
        <NButton type="primary" @click="handleSubmit">保存</NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped lang="scss">
.stage-dialog-body {
  max-height: calc(100vh - 180px);
  overflow-y: auto;
  padding-top: 16px;
  padding-right: 4px;
}

.stage-dialog-spin {
  display: flex;
  flex: 1;
  min-height: 0;
  width: 100%;
  height: 100%;
}

.stage-dialog-spin :deep(.n-spin-container) {
  display: flex;
  flex: 1;
  min-height: 0;
  width: 100%;
  height: 100%;
}

.stage-dialog-spin :deep(.n-spin-content) {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  width: 100%;
  height: 100%;
}

.stage-dialog-form {
  min-height: 0;
}

.stage-dialog-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.stage-dialog-toolbar__title {
  color: var(--n-text-color-1);
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
}

.stage-dialog-toolbar__actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.stage-dialog-main {
  display: grid;
  grid-template-columns: 400px minmax(0, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stage-dialog-editor,
.stage-dialog-side__card {
  border: 1px solid rgb(var(--border-color) / 72%);
  border-radius: 14px;
  background: rgb(var(--container-bg-color));
  box-shadow: 0 1px 2px rgb(31 35 41 / 4%);
}

.stage-dialog-editor {
  display: flex;
  flex-direction: column;
  min-height: 560px;
  height: 100%;
  overflow: hidden;
}

.stage-dialog-editor__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px 12px;
  border-bottom: 1px solid rgb(var(--border-color) / 60%);
  background: rgb(var(--layout-bg-color));
}

.stage-dialog-editor__title {
  color: var(--n-text-color-1);
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
}

.stage-dialog-editor__hint {
  margin-top: 4px;
  color: var(--n-text-color-3);
  font-size: 12px;
  line-height: 1.5;
}

.stage-dialog-editor__body {
  flex: 1;
  min-height: 0;

  :deep(.markdown-editor) {
    height: 100%;
    min-height: 0;
    border: 0;
    border-radius: 0;
  }

  :deep(.markdown-editor__textarea) {
    min-height: 0;
  }
}

.stage-dialog-side__card {
  padding: 16px 16px 14px;
}

.stage-dialog-extra {
  margin-top: 0;
}

.stage-markdown-switcher {
  display: grid;
  gap: 10px;
  margin-top: 4px;
}

.stage-markdown-switcher__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  border: 1px solid rgb(var(--border-color) / 72%);
  border-radius: 12px;
  background: rgb(var(--layout-bg-color));
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease;
}

.stage-markdown-switcher__item:hover {
  border-color: rgb(var(--em-primary-color-rgb) / 38%);
  background: rgb(var(--em-primary-color-rgb) / 0.06);
}

.stage-markdown-switcher__item--active {
  border-color: rgb(var(--em-primary-color-rgb) / 46%);
  background: rgb(var(--em-primary-color-rgb) / 0.1);
  box-shadow: inset 0 0 0 1px rgb(var(--em-primary-color-rgb) / 18%);
}

.stage-markdown-switcher__title {
  color: var(--n-text-color-1);
  font-size: 13px;
  font-weight: 600;
}

.stage-markdown-switcher__meta {
  color: var(--n-text-color-3);
  font-size: 12px;
  flex-shrink: 0;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  margin-top: 12px;
  margin-bottom: 12px;
}

.section-header--gap {
  margin-top: 20px;
}

.section-header__title {
  font-size: 16px;
  font-weight: 600;
}

.material-upload-actions {
  display: flex;
  align-items: center;
}

.material-upload-actions__input {
  display: none;
}

:deep(.stage-color-picker .n-color-picker-trigger) {
  width: 100%;
  height: 36px;
  border-radius: 10px;
  box-shadow: inset 0 0 0 1px rgb(var(--border-color) / 90%);
}

:deep(.stage-color-picker .n-color-picker-trigger__fill) {
  border-radius: 9px;
}

:deep(.stage-color-picker .n-color-picker-trigger__value) {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

:global(.stage-dialog-modal .n-card) {
  max-height: calc(100vh - 32px);
  display: flex;
  flex-direction: column;
}

:global(.stage-dialog-modal .n-card-header) {
  display: none;
}

:global(.stage-dialog-modal .n-card > .n-card__content) {
  overflow: hidden;
}

:global(.stage-dialog-modal--fullscreen .n-card) {
  height: calc(100vh - 24px);
  max-height: calc(100vh - 24px);
}

:global(.stage-dialog-modal--fullscreen .n-card > .n-card__content) {
  flex: 1;
  display: flex;
  min-height: 0;
}

:global(.stage-dialog-modal--fullscreen .stage-dialog-body) {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: none;
  min-height: 0;
  overflow: hidden;
}

:global(.stage-dialog-modal--fullscreen .stage-dialog-spin) {
  width: 100%;
  height: 100%;
}

:global(.stage-dialog-modal--fullscreen .stage-dialog-spin > .n-spin-container) {
  width: 100%;
  height: 100%;
}

:global(.stage-dialog-modal--fullscreen .stage-dialog-form) {
  display: grid;
  grid-template-columns: 400px minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 16px;
  flex: 1;
  height: 100%;
  min-height: 0;
}

:global(.stage-dialog-modal--fullscreen .stage-dialog-main) {
  display: contents;
}

:global(.stage-dialog-modal--fullscreen .stage-dialog-side) {
  grid-column: 1;
  grid-row: 1;
  min-height: 0;
}

:global(.stage-dialog-modal--fullscreen .stage-dialog-side__card) {
  height: 100%;
}

:global(.stage-dialog-modal--fullscreen .stage-dialog-extra) {
  grid-column: 1;
  grid-row: 2;
  min-height: 0;
  max-height: 32vh;
  overflow-y: auto;
  padding-right: 4px;
}

:global(.stage-dialog-modal--fullscreen .stage-dialog-editor) {
  grid-column: 2;
  grid-row: 1 / span 2;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

:global(.stage-dialog-modal--fullscreen .stage-dialog-editor__body) {
  flex: 1;
  min-height: 0;
  height: 100%;
}

:global(.stage-dialog-modal--fullscreen .stage-dialog-editor__body .markdown-editor) {
  height: 100%;
  min-height: 0;
}

:global(.stage-dialog-modal--fullscreen .stage-dialog-editor__body .markdown-editor__body) {
  height: 100%;
  min-height: 0;
}

:global(.stage-dialog-modal--fullscreen .stage-dialog-editor__body .markdown-editor__preview) {
  min-height: 0;
}

:global(.stage-dialog-modal--fullscreen .stage-dialog-editor__body .markdown-editor__textarea) {
  height: 100%;
  min-height: 0;
}

@media (width <= 1080px) {
  .stage-dialog-main {
    grid-template-columns: 1fr;
  }

  .stage-dialog-editor {
    min-height: 460px;
  }
}
</style>
