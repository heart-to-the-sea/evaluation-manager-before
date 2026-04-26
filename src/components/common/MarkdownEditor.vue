<script setup lang="ts">
import MarkdownIt from 'markdown-it';

interface Props {
  value?: string;
  placeholder?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  value: '',
  placeholder: '请输入内容（支持Markdown语法）...',
  disabled: false
});

const emit = defineEmits<{
  'update:value': [value: string];
}>();

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true
});

const textareaRef = ref<HTMLTextAreaElement | null>(null);
const content = ref(props.value);

watch(() => props.value, val => {
  content.value = val || '';
});

function handleInput(e: Event) {
  const target = e.target as HTMLTextAreaElement;
  content.value = target.value;
  emit('update:value', target.value);
}

function insertMarkdown(prefix: string, suffix: string = '') {
  if (props.disabled) return;

  const textarea = textareaRef.value;
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = content.value.substring(start, end);
  const newText = content.value.substring(0, start) + prefix + selectedText + suffix + content.value.substring(end);

  content.value = newText;
  emit('update:value', newText);

  nextTick(() => {
    textarea.focus();
    const newCursorPos = start + prefix.length + (selectedText ? selectedText.length : 0);
    textarea.setSelectionRange(newCursorPos, newCursorPos);
  });
}

function insertBold() {
  insertMarkdown('**', '**');
}

function insertItalic() {
  insertMarkdown('*', '*');
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

function insertCode() {
  insertMarkdown('`', '`');
}

function insertBlockquote() {
  insertMarkdown('> ');
}

function insertLink() {
  insertMarkdown('[', '](url)');
}

function insertHorizontalRule() {
  insertMarkdown('\n---\n');
}

function renderMarkdown(text: string): string {
  return md.render(text || '');
}

const renderedContent = computed(() => renderMarkdown(content.value));
</script>

<template>
  <div class="markdown-editor" :class="{ 'markdown-editor--disabled': disabled }">
    <div class="markdown-editor__toolbar">
      <NButton size="tiny" quaternary @click="insertBold" title="加粗 (Ctrl+B)">
        <template #icon>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
            <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
          </svg>
        </template>
      </NButton>
      <NButton size="tiny" quaternary @click="insertItalic" title="斜体 (Ctrl+I)">
        <template #icon>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="4" x2="10" y2="4"></line>
            <line x1="14" y1="20" x2="5" y2="20"></line>
            <line x1="15" y1="4" x2="9" y2="20"></line>
          </svg>
        </template>
      </NButton>
      <NDivider vertical />
      <NButton size="tiny" quaternary @click="insertHeading" title="标题">
        <template #icon>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 12h16M4 6h16M4 18h10"></path>
          </svg>
        </template>
      </NButton>
      <NButton size="tiny" quaternary @click="insertUnorderedList" title="无序列表">
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
      <NButton size="tiny" quaternary @click="insertOrderedList" title="有序列表">
        <template #icon>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="10" y1="6" x2="21" y2="6"></line>
            <line x1="10" y1="12" x2="21" y2="12"></line>
            <line x1="10" y1="18" x2="21" y2="18"></line>
            <path d="M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path>
          </svg>
        </template>
      </NButton>
      <NDivider vertical />
      <NButton size="tiny" quaternary @click="insertCode" title="行内代码">
        <template #icon>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
        </template>
      </NButton>
      <NButton size="tiny" quaternary @click="insertBlockquote" title="引用">
        <template #icon>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21"></path>
            <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3"></path>
          </svg>
        </template>
      </NButton>
      <NButton size="tiny" quaternary @click="insertLink" title="链接">
        <template #icon>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
        </template>
      </NButton>
      <NDivider vertical />
      <NButton size="tiny" quaternary @click="insertHorizontalRule" title="分割线">
        <template #icon>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="2" y1="12" x2="22" y2="12"></line>
          </svg>
        </template>
      </NButton>
    </div>
    <div class="markdown-editor__body">
      <textarea
        ref="textareaRef"
        :value="content"
        :placeholder="placeholder"
        :disabled="disabled"
        class="markdown-editor__textarea"
        @input="handleInput"
      ></textarea>
      <div class="markdown-editor__preview markdown-body" v-html="renderedContent"></div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.markdown-editor {
  display: flex;
  flex-direction: column;
  border: 1px solid rgb(var(--border-color));
  border-radius: 8px;
  overflow: hidden;
  background: rgb(var(--container-bg-color));
  min-height: 150px;

  &--disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.markdown-editor__toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 6px 10px;
  border-bottom: 1px solid rgb(var(--border-color) / 60%);
  background: rgb(var(--layout-bg-color));

  :deep(.n-button) {
    padding: 4px 6px;
  }
}

.markdown-editor__body {
  display: flex;
  flex: 1;
  min-height: 0;
  height: 100%;
}

.markdown-editor__textarea {
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-right: 1px solid rgb(var(--border-color) / 60%);
  resize: none;
  font-size: 13px;
  line-height: 1.6;
  color: var(--n-text-color-1);
  background: transparent;
  font-family: monospace;
  min-height: 800px;
  height: 100%;
  box-sizing: border-box;

  &:focus {
    outline: none;
  }

  &::placeholder {
    color: var(--n-text-color-3);
  }
}

.markdown-editor__preview {
  flex: 1;
  padding: 12px 16px;
  overflow-y: auto;
  font-size: 13px;
  line-height: 1.6;
  color: var(--n-text-color-2);
  height: 100%;
  box-sizing: border-box;

  :deep(h1) {
    font-size: 16px;
    font-weight: 600;
    color: var(--n-text-color-1);
    margin-bottom: 6px;
    border-bottom: 1px solid rgb(var(--border-color) / 40%);
    padding-bottom: 4px;
  }

  :deep(h2) {
    font-size: 14px;
    font-weight: 600;
    color: var(--n-text-color-1);
    margin-bottom: 4px;
  }

  :deep(h3) {
    font-size: 13px;
    font-weight: 600;
    color: var(--n-text-color-1);
    margin-bottom: 3px;
  }

  :deep(p) {
    margin-bottom: 6px;
  }

  :deep(ul),
  :deep(ol) {
    margin-bottom: 6px;
    padding-left: 18px;
  }

  :deep(li) {
    margin-bottom: 2px;
  }

  :deep(code) {
    padding: 1px 5px;
    border-radius: 3px;
    background: rgb(var(--layout-bg-color));
    font-family: monospace;
    font-size: 11px;
    color: var(--em-primary-color);
  }

  :deep(pre) {
    padding: 10px;
    border-radius: 6px;
    background: rgb(var(--layout-bg-color));
    overflow-x: auto;
    margin-bottom: 6px;

    code {
      padding: 0;
      background: none;
    }
  }

  :deep(blockquote) {
    margin: 6px 0;
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
    font-weight: 600;
    color: var(--n-text-color-1);
  }

  :deep(em) {
    font-style: italic;
  }

  :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 6px;
    font-size: 12px;

    th,
    td {
      padding: 6px 10px;
      border: 1px solid rgb(var(--border-color) / 60%);
      text-align: left;
    }

    th {
      background: rgb(var(--layout-bg-color));
      font-weight: 600;
    }
  }

  :deep(hr) {
    border: none;
    border-top: 1px solid rgb(var(--border-color) / 60%);
    margin: 8px 0;
  }
}
</style>