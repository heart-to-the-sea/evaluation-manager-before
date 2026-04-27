<script setup lang="ts">
import { renderMarkdown } from '@/utils/markdown';
import { fetchFileRecordUpload, fetchStorageConfigOptions } from '@/service/api';

interface Props {
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  previewOnly?: boolean;
  defaultMode?: 'edit' | 'split' | 'preview';
  uploadStorageGroup?: string;
  uploadStorageConfigId?: string;
  uploadRemark?: string;
}

type ViewMode = 'edit' | 'split' | 'preview';

const props = withDefaults(defineProps<Props>(), {
  value: '',
  placeholder: '请输入内容，支持 Markdown 语法...',
  disabled: false,
  previewOnly: false,
  defaultMode: 'split',
  uploadStorageGroup: 'attachment',
  uploadStorageConfigId: '',
  uploadRemark: 'Markdown 编辑器文件上传'
});

const emit = defineEmits<{
  'update:value': [value: string];
}>();

const textareaRef = ref<HTMLTextAreaElement | null>(null);
const imageInputRef = ref<HTMLInputElement | null>(null);
const attachmentInputRef = ref<HTMLInputElement | null>(null);
const content = ref(props.value);
const imageUploading = ref(false);
const attachmentUploading = ref(false);
const viewMode = ref<ViewMode>(props.previewOnly ? 'preview' : props.defaultMode);
const showImagePreview = ref(false);
const previewImageSrc = ref('');

const renderedContent = computed(() => renderMarkdown(content.value || ''));
const isEditMode = computed(() => viewMode.value === 'edit');
const isSplitMode = computed(() => viewMode.value === 'split');
const isPreviewMode = computed(() => viewMode.value === 'preview');

watch(
  () => props.value,
  val => {
    content.value = val || '';
  }
);

watch(
  () => props.previewOnly,
  value => {
    if (value) {
      viewMode.value = 'preview';
    } else if (viewMode.value === 'preview') {
      viewMode.value = props.defaultMode;
    }
  }
);

watch(
  () => props.defaultMode,
  value => {
    if (!props.previewOnly) {
      viewMode.value = value;
    }
  }
);

function setViewMode(mode: ViewMode) {
  if (props.previewOnly) return;
  viewMode.value = mode;
}

function handleInput(event: Event) {
  const target = event.target as HTMLTextAreaElement;
  content.value = target.value;
  emit('update:value', target.value);
}

function updateContent(value: string) {
  content.value = value;
  emit('update:value', value);
}

function insertMarkdown(prefix: string, suffix = '') {
  if (props.disabled) return;

  const textarea = textareaRef.value;
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = content.value.substring(start, end);
  const nextValue = content.value.substring(0, start) + prefix + selectedText + suffix + content.value.substring(end);

  updateContent(nextValue);

  nextTick(() => {
    textarea.focus();
    const cursor = start + prefix.length + selectedText.length;
    textarea.setSelectionRange(cursor, cursor);
  });
}

function insertAtCursor(text: string) {
  if (props.disabled) return;

  const textarea = textareaRef.value;
  if (!textarea) {
    updateContent(`${content.value}${content.value ? '\n' : ''}${text}`);
    return;
  }

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const nextValue = content.value.substring(0, start) + text + content.value.substring(end);

  updateContent(nextValue);

  nextTick(() => {
    textarea.focus();
    const cursor = start + text.length;
    textarea.setSelectionRange(cursor, cursor);
  });
}

function insertBold() {
  insertMarkdown('**', '**');
}

function insertItalic() {
  insertMarkdown('*', '*');
}

function insertStrike() {
  insertMarkdown('~~', '~~');
}

function insertHighlight() {
  insertMarkdown('==', '==');
}

function insertHeading() {
  insertMarkdown('## ');
}

function insertUnorderedList() {
  insertMarkdown('- ');
}

function insertOrderedList() {
  insertMarkdown('1. ');
}

function insertTaskList() {
  insertAtCursor('- [ ] 待办事项\n- [x] 已完成事项');
}

function insertCode() {
  insertMarkdown('`', '`');
}

function insertCodeBlock() {
  insertAtCursor('```text\n请输入内容\n```');
}

function insertBlockquote() {
  insertMarkdown('> ');
}

function insertLink() {
  insertMarkdown('[链接文字]', '(https://example.com)');
}

function insertTable() {
  insertAtCursor('| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n| 内容1 | 内容2 | 内容3 |\n| 内容4 | 内容5 | 内容6 |');
}

function insertHorizontalRule() {
  insertAtCursor('\n---\n');
}

function insertSubscript() {
  insertMarkdown('~', '~');
}

function insertSuperscript() {
  insertMarkdown('^', '^');
}

function openImageUpload() {
  if (props.disabled || imageUploading.value) return;
  imageInputRef.value?.click();
}

function openAttachmentUpload() {
  if (props.disabled || attachmentUploading.value) return;
  attachmentInputRef.value?.click();
}

function extractImageFileFromClipboard(event: ClipboardEvent) {
  const items = event.clipboardData?.items || [];
  for (const item of items) {
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      return item.getAsFile();
    }
  }
  return null;
}

async function handlePaste(event: ClipboardEvent) {
  if (props.disabled || imageUploading.value) return;

  const file = extractImageFileFromClipboard(event);
  if (!file) {
    return;
  }

  event.preventDefault();

  imageUploading.value = true;
  try {
    const fileUrl = await uploadFile(file, 'Markdown 粘贴图片上传');
    if (!fileUrl) {
      window.$message?.error('粘贴图片上传失败');
      return;
    }

    const altText = sanitizeMarkdownText(stripFileExtension(file.name) || '粘贴图片');
    insertAtCursor(`![${altText}](${fileUrl})`);
    window.$message?.success('图片已粘贴并上传');
  } finally {
    imageUploading.value = false;
  }
}

async function handleImageFileChange(event: Event) {
  const input = event.target as HTMLInputElement | null;
  const file = input?.files?.[0];
  if (!file) {
    resetImageInput();
    return;
  }

  if (!file.type.startsWith('image/')) {
    window.$message?.warning('请选择图片文件');
    resetImageInput();
    return;
  }

  imageUploading.value = true;
  try {
    const fileUrl = await uploadFile(file, 'Markdown 图片上传');
    if (!fileUrl) return;

    const altText = sanitizeMarkdownText(stripFileExtension(file.name) || '图片');
    insertAtCursor(`![${altText}](${fileUrl})`);
    window.$message?.success('图片上传成功');
  } finally {
    imageUploading.value = false;
    resetImageInput();
  }
}

async function handleAttachmentFileChange(event: Event) {
  const input = event.target as HTMLInputElement | null;
  const file = input?.files?.[0];
  if (!file) {
    resetAttachmentInput();
    return;
  }

  attachmentUploading.value = true;
  try {
    const fileUrl = await uploadFile(file, 'Markdown 附件上传');
    if (!fileUrl) return;

    const fileName = sanitizeMarkdownText(file.name);
    insertAtCursor(`[附件：${fileName}](${fileUrl})`);
    window.$message?.success('附件上传成功');
  } finally {
    attachmentUploading.value = false;
    resetAttachmentInput();
  }
}

async function uploadFile(file: File, remark: string) {
  const storageConfigId = await resolveUploadStorageConfigId();
  if (!storageConfigId) {
    window.$message?.error('未找到可用的文件存储配置');
    return '';
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('storageGroup', props.uploadStorageGroup);
  formData.append('storageConfigId', storageConfigId);
  formData.append('remark', props.uploadRemark || remark);

  const { data, error } = await fetchFileRecordUpload(formData);
  if (error) {
    return '';
  }

  const fileUrl = String(data?.fileUrl || '').trim();
  if (!fileUrl) {
    window.$message?.error('上传成功，但未返回可访问地址，请检查文件存储配置');
    return '';
  }

  return fileUrl;
}

async function resolveUploadStorageConfigId() {
  if (props.uploadStorageConfigId) {
    return props.uploadStorageConfigId;
  }

  const { data, error } = await fetchStorageConfigOptions(props.uploadStorageGroup || undefined);
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

function sanitizeMarkdownText(value: string) {
  return value.replace(/[\[\]\(\)]/g, '').trim() || '附件';
}

function stripFileExtension(fileName: string) {
  return fileName.replace(/\.[^.]+$/, '').trim() || fileName;
}

function resetImageInput() {
  if (imageInputRef.value) {
    imageInputRef.value.value = '';
  }
}

function resetAttachmentInput() {
  if (attachmentInputRef.value) {
    attachmentInputRef.value.value = '';
  }
}

function handlePreviewClick(event: MouseEvent) {
  const target = event.target as HTMLElement | null;
  const image = target?.closest('img') as HTMLImageElement | null;
  if (!image?.src) {
    return;
  }

  previewImageSrc.value = image.src;
  showImagePreview.value = true;
}
</script>

<template>
  <div
    class="markdown-editor"
    :class="{
      'markdown-editor--disabled': disabled,
      'markdown-editor--preview-only': previewOnly,
      'markdown-editor--edit': isEditMode,
      'markdown-editor--split': isSplitMode,
      'markdown-editor--preview': isPreviewMode
    }"
  >
    <div v-if="!previewOnly" class="markdown-editor__toolbar">
      <div class="markdown-editor__toolbar-main">
        <NButton size="tiny" quaternary title="加粗" @click="insertBold">
          <template #icon>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
              <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
            </svg>
          </template>
        </NButton>
        <NButton size="tiny" quaternary title="斜体" @click="insertItalic">
          <template #icon>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="4" x2="10" y2="4"></line>
              <line x1="14" y1="20" x2="5" y2="20"></line>
              <line x1="15" y1="4" x2="9" y2="20"></line>
            </svg>
          </template>
        </NButton>
        <NButton size="tiny" quaternary title="删除线" @click="insertStrike">
          <template #icon>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 4H9a3 3 0 0 0-2.83 4"></path>
              <path d="M14 12a4 4 0 0 1 0 8H6"></path>
              <path d="M4 12h16"></path>
            </svg>
          </template>
        </NButton>
        <NButton size="tiny" quaternary title="高亮" @click="insertHighlight">
          <template #icon>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m9 11 6 6"></path>
              <path d="m14 4 6 6"></path>
              <path d="M8 13 2 19l3 3 6-6"></path>
              <path d="m16 8 2-2"></path>
            </svg>
          </template>
        </NButton>
        <NDivider vertical />
        <NButton size="tiny" quaternary title="标题" @click="insertHeading">
          <template #icon>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 12h16M4 6h16M4 18h10"></path>
            </svg>
          </template>
        </NButton>
        <NButton size="tiny" quaternary title="无序列表" @click="insertUnorderedList">
          <template #icon>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <circle cx="4" cy="6" r="1" fill="currentColor"></circle>
              <circle cx="4" cy="12" r="1" fill="currentColor"></circle>
              <circle cx="4" cy="18" r="1" fill="currentColor"></circle>
            </svg>
          </template>
        </NButton>
        <NButton size="tiny" quaternary title="有序列表" @click="insertOrderedList">
          <template #icon>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="10" y1="6" x2="21" y2="6"></line>
              <line x1="10" y1="12" x2="21" y2="12"></line>
              <line x1="10" y1="18" x2="21" y2="18"></line>
              <path d="M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path>
            </svg>
          </template>
        </NButton>
        <NButton size="tiny" quaternary title="任务列表" @click="insertTaskList">
          <template #icon>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m9 11 2 2 4-4"></path>
              <rect x="3" y="4" width="18" height="16" rx="2"></rect>
            </svg>
          </template>
        </NButton>
        <NButton size="tiny" quaternary title="表格" @click="insertTable">
          <template #icon>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="16" rx="2"></rect>
              <path d="M3 10h18M9 4v16M15 4v16"></path>
            </svg>
          </template>
        </NButton>
        <NDivider vertical />
        <NButton size="tiny" quaternary title="行内代码" @click="insertCode">
          <template #icon>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="16 18 22 12 16 6"></polyline>
              <polyline points="8 6 2 12 8 18"></polyline>
            </svg>
          </template>
        </NButton>
        <NButton size="tiny" quaternary title="代码块" @click="insertCodeBlock">
          <template #icon>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M8 6 2 12l6 6"></path>
              <path d="m16 6 6 6-6 6"></path>
              <path d="M13 4 11 20"></path>
            </svg>
          </template>
        </NButton>
        <NButton size="tiny" quaternary title="引用" @click="insertBlockquote">
          <template #icon>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21"></path>
              <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3"></path>
            </svg>
          </template>
        </NButton>
        <NButton size="tiny" quaternary title="链接" @click="insertLink">
          <template #icon>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
          </template>
        </NButton>
        <NButton size="tiny" quaternary title="下标" @click="insertSubscript">
          <template #icon>
            <span class="markdown-editor__mini-text">X₂</span>
          </template>
        </NButton>
        <NButton size="tiny" quaternary title="上标" @click="insertSuperscript">
          <template #icon>
            <span class="markdown-editor__mini-text">X²</span>
          </template>
        </NButton>
        <NButton size="tiny" quaternary :loading="imageUploading" title="上传图片" @click="openImageUpload">
          <template #icon>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="5" width="18" height="14" rx="2"></rect>
              <circle cx="8.5" cy="10" r="1.5"></circle>
              <path d="M21 15l-5-5L5 21"></path>
            </svg>
          </template>
        </NButton>
        <NButton size="tiny" quaternary :loading="attachmentUploading" title="上传附件" @click="openAttachmentUpload">
          <template #icon>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21.44 11.05 12.25 20.24a5.5 5.5 0 0 1-7.78-7.78l9.2-9.19a3.5 3.5 0 1 1 4.95 4.95l-9.2 9.19a1.5 1.5 0 1 1-2.12-2.12l8.49-8.49"></path>
            </svg>
          </template>
        </NButton>
        <NDivider vertical />
        <NButton size="tiny" quaternary title="分割线" @click="insertHorizontalRule">
          <template #icon>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="2" y1="12" x2="22" y2="12"></line>
            </svg>
          </template>
        </NButton>
      </div>

      <div class="markdown-editor__toolbar-mode">
        <span class="markdown-editor__toolbar-mode-label">视图</span>
        <div class="markdown-editor__toolbar-mode-group">
          <button
            type="button"
            class="markdown-editor__mode-btn"
            :class="{ 'markdown-editor__mode-btn--active': isEditMode }"
            @click="setViewMode('edit')"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
            </svg>
            <span>仅编辑</span>
          </button>
          <button
            type="button"
            class="markdown-editor__mode-btn"
            :class="{ 'markdown-editor__mode-btn--active': isSplitMode }"
            @click="setViewMode('split')"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="16" rx="2"></rect>
              <path d="M12 4v16"></path>
            </svg>
            <span>同时展示</span>
          </button>
          <button
            type="button"
            class="markdown-editor__mode-btn"
            :class="{ 'markdown-editor__mode-btn--active': isPreviewMode }"
            @click="setViewMode('preview')"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <span>仅预览</span>
          </button>
        </div>
      </div>

      <input ref="imageInputRef" type="file" accept="image/*" class="markdown-editor__file-input" @change="handleImageFileChange" />
      <input ref="attachmentInputRef" type="file" class="markdown-editor__file-input" @change="handleAttachmentFileChange" />
    </div>

    <div class="markdown-editor__body">
      <textarea
        v-if="!previewOnly && !isPreviewMode"
      ref="textareaRef"
      :value="content"
      :placeholder="placeholder"
      :disabled="disabled"
      class="markdown-editor__textarea"
      @input="handleInput"
      @paste="handlePaste"
      ></textarea>
      <div
        v-if="!isEditMode"
        class="markdown-editor__preview markdown-body"
        v-html="renderedContent"
        @click="handlePreviewClick"
      ></div>
    </div>
    <NImagePreview v-model:show="showImagePreview" :src="previewImageSrc" show-toolbar show-toolbar-tooltip />
  </div>
</template>

<style scoped lang="scss">
.markdown-editor {
  display: flex;
  flex-direction: column;
  min-height: 150px;
  overflow: hidden;
  border: 1px solid rgb(var(--border-color));
  border-radius: 10px;
  background: rgb(var(--container-bg-color));

  &--disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &--preview-only {
    .markdown-editor__body {
      border: none;
    }

    .markdown-editor__preview {
      flex: 1;
    }
  }

  &--edit {
    .markdown-editor__textarea {
      border-right: none;
    }
  }

  &--preview {
    .markdown-editor__preview {
      flex: 1;
    }
  }
}

.markdown-editor__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
  border-bottom: 1px solid rgb(var(--border-color) / 60%);
  background: rgb(var(--layout-bg-color));

  :deep(.n-button) {
    padding: 4px 6px;
  }
}

.markdown-editor__toolbar-main {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px;
}

.markdown-editor__toolbar-mode {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px;
  border-radius: 10px;
  background: rgb(var(--container-bg-color) / 96%);
  box-shadow:
    inset 0 0 0 1px rgb(var(--border-color) / 60%),
    0 1px 2px rgb(15 23 42 / 4%);
  flex-shrink: 0;
}

.markdown-editor__toolbar-mode-label {
  color: var(--n-text-color-3);
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
}

.markdown-editor__toolbar-mode-group {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.markdown-editor__mode-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 28px;
  padding: 0 10px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--n-text-color-2);
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.markdown-editor__mode-btn:hover {
  background: rgb(var(--em-primary-color-rgb) / 0.08);
  color: var(--n-text-color-1);
}

.markdown-editor__mode-btn--active {
  background: rgb(var(--em-primary-color-rgb) / 0.14);
  color: var(--em-primary-color);
  box-shadow:
    inset 0 0 0 1px rgb(var(--em-primary-color-rgb) / 18%),
    0 1px 2px rgb(var(--em-primary-color-rgb) / 10%);
}

.markdown-editor__mode-btn:active {
  transform: translateY(1px);
}

.markdown-editor__mini-text {
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}

.markdown-editor__file-input {
  display: none;
}

.markdown-editor__body {
  display: flex;
  flex: 1;
  min-height: 0;
  height: 100%;
}

.markdown-editor__textarea {
  flex: 1;
  min-height: 800px;
  height: 100%;
  box-sizing: border-box;
  padding: 12px 16px;
  border: none;
  border-right: 1px solid rgb(var(--border-color) / 60%);
  background: transparent;
  color: var(--n-text-color-1);
  font-size: 13px;
  line-height: 1.6;
  font-family: Consolas, 'Courier New', monospace;
  resize: none;

  &:focus {
    outline: none;
  }

  &::placeholder {
    color: var(--n-text-color-3);
  }
}

.markdown-editor__preview {
  flex: 1;
  height: 100%;
  box-sizing: border-box;
  padding: 12px 16px;
  overflow-y: auto;
  color: var(--n-text-color-2);
  font-size: 13px;
  line-height: 1.7;

  :deep(h1) {
    margin: 0 0 8px;
    padding-bottom: 4px;
    border-bottom: 1px solid rgb(var(--border-color) / 40%);
    color: var(--n-text-color-1);
    font-size: 16px;
    font-weight: 600;
  }

  :deep(h2) {
    margin: 14px 0 6px;
    color: var(--n-text-color-1);
    font-size: 14px;
    font-weight: 600;
  }

  :deep(h3) {
    margin: 10px 0 4px;
    color: var(--n-text-color-1);
    font-size: 13px;
    font-weight: 600;
  }

  :deep(p) {
    margin: 0 0 8px;
  }

  :deep(ul),
  :deep(ol) {
    margin: 0 0 8px;
    padding-left: 18px;
  }

  :deep(li) {
    margin-bottom: 4px;
  }

  :deep(input[type='checkbox']) {
    margin-right: 6px;
  }

  :deep(code) {
    padding: 1px 5px;
    border-radius: 3px;
    background: rgb(var(--layout-bg-color));
    color: var(--em-primary-color);
    font-size: 11px;
    font-family: Consolas, 'Courier New', monospace;
  }

  :deep(pre) {
    margin: 0 0 8px;
    padding: 10px;
    overflow-x: auto;
    border-radius: 6px;
    background: rgb(var(--layout-bg-color));

    code {
      padding: 0;
      background: none;
      color: inherit;
    }
  }

  :deep(blockquote) {
    margin: 6px 0 8px;
    padding: 6px 10px;
    border-left: 3px solid var(--em-primary-color);
    background: rgb(var(--layout-bg-color));
    color: var(--n-text-color-3);
  }

  :deep(a) {
    color: var(--em-primary-color);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  :deep(strong) {
    color: var(--n-text-color-1);
    font-weight: 600;
  }

  :deep(table) {
    width: 100%;
    margin: 0 0 8px;
    border-collapse: collapse;
    font-size: 12px;

    th,
    td {
      padding: 6px 10px;
      border: 1px solid rgb(var(--border-color) / 60%);
      text-align: left;
      vertical-align: top;
    }

    th {
      background: rgb(var(--layout-bg-color));
      color: var(--n-text-color-1);
      font-weight: 600;
    }
  }

  :deep(mark) {
    padding: 0 4px;
    border-radius: 4px;
    background: rgb(250 204 21 / 20%);
    color: inherit;
  }

  :deep(dl) {
    margin: 0 0 8px;
  }

  :deep(dt) {
    color: var(--n-text-color-1);
    font-weight: 600;
  }

  :deep(dd) {
    margin: 0 0 6px 16px;
  }

  :deep(footnote) {
    font-size: 12px;
  }

  :deep(.footnotes) {
    margin-top: 12px;
    padding-top: 8px;
    border-top: 1px solid rgb(var(--border-color) / 60%);
    color: var(--n-text-color-3);
    font-size: 12px;
  }

  :deep(.markdown-it-task-list-item) {
    list-style: none;
  }

  :deep(.info),
  :deep(.success),
  :deep(.warning),
  :deep(.error) {
    margin: 0 0 8px;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid rgb(var(--border-color) / 60%);
    background: rgb(var(--layout-bg-color));
  }

  :deep(.info) {
    border-color: rgb(32 128 240 / 26%);
    background: rgb(32 128 240 / 8%);
  }

  :deep(.success) {
    border-color: rgb(24 160 88 / 26%);
    background: rgb(24 160 88 / 8%);
  }

  :deep(.warning) {
    border-color: rgb(240 160 32 / 26%);
    background: rgb(240 160 32 / 8%);
  }

  :deep(.error) {
    border-color: rgb(208 48 80 / 26%);
    background: rgb(208 48 80 / 8%);
  }

  :deep(hr) {
    margin: 8px 0;
    border: none;
    border-top: 1px solid rgb(var(--border-color) / 60%);
  }

  :deep(img) {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    cursor: zoom-in;
  }

  :deep(img:hover) {
    opacity: 0.92;
  }
}

@media (width <= 960px) {
  .markdown-editor__toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .markdown-editor__toolbar-mode {
    width: 100%;
    justify-content: flex-end;
    flex-wrap: wrap;
  }
}
</style>
