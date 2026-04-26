# 2026-04-26 学员工作台页面重新设计

## 本次提交范围

本次对学员工作台页面进行全面重新设计，优化布局结构，新增 Markdown 编辑器支持，完善阶段资料展示功能。

## 已完成内容

### 1. 页面布局重构

- 顶部区域：用户欢迎卡片 + 阶段进度时间线（节点+轴形式）
- 左侧主区域：当前阶段信息（阶段名称、预计完成时间、进行中状态）
- 右侧边栏（300px）：日历组件 + 日报列表
- 移除原有的 InfoGridCard，使用 DictTag 显示状态

### 2. Markdown 编辑器组件

新增 `MarkdownEditor.vue` 组件：
- 所见即所得的双栏布局（编辑区 + 预览区）
- 工具栏支持：加粗、斜体、标题、无序列表、有序列表、代码、引用、链接、分割线
- 使用 markdown-it 进行实时渲染
- 支持 disabled 禁用状态

### 3. 阶段说明与考核说明

- 使用 Markdown 格式存储和渲染
- 支持标题、列表、加粗、斜体、代码块、表格、引用等格式
- 各自独立滚动区域，最大高度 400px
- 内容丰富：阶段说明 50 项任务清单，考核说明详细考核大纲

### 4. 阶段资料展示

新增资料区域功能：
- 资料列表展示（图标、标题、类型标签）
- 根据文件类型显示不同图标（视频、文档等）
- 多媒体文件显示"播放"按钮
- 其他文件显示"下载"按钮
- 支持 hover 效果

### 5. 日报功能

- 日报列表展示历史提交记录
- 支持 Markdown 格式内容
- 新增/修改日报弹窗使用 MarkdownEditor
- 弹窗宽度 80%，编辑器高度 800px

### 6. 其他优化

- 阶段进度条使用 DictTag 展示字典颜色
- 日期使用统一色块样式
- 响应式布局适配（宽度 <= 1180px 时调整为单列）

## 主要涉及文件

| 文件 | 说明 |
|------|------|
| `src/pages/intern-assessment/workbench/index.vue` | 工作台主页面 |
| `src/components/common/MarkdownEditor.vue` | Markdown 编辑器组件 |
| `src/components/features/intern-assessment/WorkbenchDailyCalendar.vue` | 日历组件 |
| `src/components/features/intern-assessment/WorkbenchDailyReportList.vue` | 日报列表组件 |
| `src/components/features/intern-assessment/WorkbenchStageTasks.vue` | 阶段任务组件 |
| `src/components/features/intern-assessment/WorkbenchStagesProgress.vue` | 阶段进度组件 |
| `src/components/common/DictTag.vue` | 字典标签组件（复用） |
| `src/components/pages/InfoPageLayout.vue` | 页面布局组件（复用） |

## 数据结构

### mockLearningTasks

```typescript
interface LearningTask {
  title: string;       // 资料标题
  type: string;         // 类型：学习资料、视频课程、课件、考核任务
  fileType: string;     // 文件类型：doc、pdf、ppt、video、audio、exam
  url: string;          // 资源链接
}
```

### mockCurrentStage

```typescript
interface CurrentStage {
  name: string;                         // 阶段名称
  description: string;                  // Markdown 格式阶段说明
  assessmentDescription: string;        // Markdown 格式考核说明
}
```

## 提交分支

- 分支名称：`worker`
- 推送至：`origin/worker`
