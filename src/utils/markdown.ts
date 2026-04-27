import MarkdownIt from 'markdown-it';
import markdownItAbbr from 'markdown-it-abbr';
import markdownItAttrs from 'markdown-it-attrs';
import markdownItContainer from 'markdown-it-container';
import markdownItDeflist from 'markdown-it-deflist';
import markdownItFootnote from 'markdown-it-footnote';
import markdownItMark from 'markdown-it-mark';
import markdownItMultimdTable from 'markdown-it-multimd-table';
import markdownItSub from 'markdown-it-sub';
import markdownItSup from 'markdown-it-sup';
import markdownItTaskLists from 'markdown-it-task-lists';

export function createMarkdownParser() {
  return new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true,
    breaks: true
  })
    .use(markdownItAbbr)
    .use(markdownItAttrs)
    .use(markdownItDeflist)
    .use(markdownItFootnote)
    .use(markdownItMark)
    .use(markdownItMultimdTable, {
      multiline: true,
      rowspan: true,
      headerless: true
    })
    .use(markdownItSub)
    .use(markdownItSup)
    .use(markdownItTaskLists, {
      enabled: true,
      label: true,
      labelAfter: true
    })
    .use(markdownItContainer, 'info')
    .use(markdownItContainer, 'success')
    .use(markdownItContainer, 'warning')
    .use(markdownItContainer, 'error');
}

const markdown = createMarkdownParser();

export function renderMarkdown(value?: string | null) {
  return markdown.render(value || '');
}
