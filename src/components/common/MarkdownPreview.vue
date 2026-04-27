<script setup lang="ts">
import { computed, ref } from 'vue';
import { renderMarkdown } from '@/utils/markdown';

interface Props {
  content?: string | null;
  emptyText?: string;
  compact?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  content: '',
  emptyText: '-',
  compact: false
});

const hasContent = computed(() => Boolean(String(props.content || '').trim()));
const html = computed(() => renderMarkdown(props.content));
const showImagePreview = ref(false);
const previewImageSrc = ref('');

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
  <template v-if="hasContent">
    <div
      class="markdown-preview"
      :class="{ 'markdown-preview--compact': compact }"
      v-html="html"
      @click="handlePreviewClick"
    ></div>
    <NImagePreview v-model:show="showImagePreview" :src="previewImageSrc" show-toolbar show-toolbar-tooltip />
  </template>
  <span v-else class="markdown-preview__empty">{{ emptyText }}</span>
</template>

<style scoped lang="scss">
.markdown-preview {
  color: var(--n-text-color-2);
  font-size: 13px;
  line-height: 1.65;
  word-break: break-word;

  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4),
  :deep(h5),
  :deep(h6) {
    margin: 0 0 8px;
    color: var(--n-text-color-1);
    font-weight: 600;
    line-height: 1.45;
  }

  :deep(h1) {
    font-size: 16px;
  }

  :deep(h2) {
    font-size: 15px;
  }

  :deep(h3) {
    font-size: 14px;
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

  :deep(code) {
    padding: 1px 6px;
    border-radius: 4px;
    background: rgb(var(--layout-bg-color));
    color: var(--em-primary-color);
    font-size: 12px;
  }

  :deep(pre) {
    margin: 0 0 8px;
    padding: 10px 12px;
    border-radius: 8px;
    background: rgb(var(--layout-bg-color));
    overflow-x: auto;

    code {
      padding: 0;
      background: transparent;
      color: inherit;
    }
  }

  :deep(blockquote) {
    margin: 0 0 8px;
    padding: 8px 12px;
    border-left: 3px solid var(--em-primary-color);
    border-radius: 0 8px 8px 0;
    background: rgb(var(--layout-bg-color));
    color: var(--n-text-color-3);
  }

  :deep(a) {
    color: var(--em-primary-color);
    text-decoration: none;
  }

  :deep(a:hover) {
    text-decoration: underline;
  }

  :deep(table) {
    width: 100%;
    margin: 0 0 8px;
    border-collapse: collapse;
    font-size: 12px;
  }

  :deep(th),
  :deep(td) {
    padding: 6px 10px;
    border: 1px solid rgb(var(--border-color) / 60%);
    text-align: left;
    vertical-align: top;
  }

  :deep(th) {
    background: rgb(var(--layout-bg-color));
    color: var(--n-text-color-1);
    font-weight: 600;
  }

  :deep(hr) {
    margin: 8px 0;
    border: 0;
    border-top: 1px solid rgb(var(--border-color) / 60%);
  }

  :deep(img) {
    max-width: 100%;
    border-radius: 8px;
    cursor: zoom-in;
    transition: opacity 0.2s ease;
  }

  :deep(img:hover) {
    opacity: 0.92;
  }
}

.markdown-preview--compact {
  font-size: 12px;
  line-height: 1.55;

  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4),
  :deep(h5),
  :deep(h6) {
    margin-bottom: 6px;
  }

  :deep(p),
  :deep(ul),
  :deep(ol),
  :deep(pre),
  :deep(blockquote),
  :deep(table),
  :deep(hr) {
    margin-bottom: 6px;
  }

  :deep(li) {
    margin-bottom: 2px;
  }
}

.markdown-preview__empty {
  color: var(--n-text-color-3);
}
</style>
