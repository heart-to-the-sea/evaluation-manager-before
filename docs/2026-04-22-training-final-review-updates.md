# 2026-04-22 培训与总体考评改动记录

## 本次提交范围

本次主要整理了培训管理、总体考评、最终考核模板与相关公共组件，便于后续继续迭代总体考评模板与导师汇总流程。

## 已完成内容

### 1. 总体考评与公共评分页

- 新增总体考评公共页面与相关路由。
- 总体考评页左侧详情区按培训详情页风格对齐。
- 培训履历、日报日历、试卷详情等内容支持在公共评分页查看。
- 评分人可通过公开链接独立提交评分。
- 去除了公共评分页中不应出现的离场处理信息。
- 去除了页头英文 `FINAL REVIEW` 标识，统一为中文界面。

### 2. 最终考核模板

- 新增最终考核模板页面、弹窗与接口类型。
- 路径模板支持选择最终考核模板。
- 默认模板维度已调整为：
  - 工作能力
  - 工作成果
  - 沟通表达
- 默认评分项已同步为当前业务口径，便于继续细化导师汇总评价。

### 3. 培训详情与考核流程

- 培训详情页增加总体考评相关展示与入口。
- 培训详情中的培训履历、试卷信息与公共评分页展示保持一致。
- 日报日历组件抽离为可复用组件，并在多处复用。

### 4. 角色与路由接入

- 新增最终考核模板相关页面路由常量与接口地址。
- 角色管理页面补充相关入口适配。
- 鉴权中间件补充对公共总体考评页面的访问处理。

## 主要涉及文件

- `src/components/features/intern-assessment/FinalTemplateDialog.vue`
- `src/components/features/intern-assessment/PaperInfoModal.vue`
- `src/components/features/intern-assessment/TemplateDialog.vue`
- `src/components/features/intern-assessment/PathDailyCalendar.vue`
- `src/pages/intern-assessment/final-template/`
- `src/pages/intern-assessment/intern/index.vue`
- `src/pages/intern-assessment/intern/info/[id].vue`
- `src/pages/intern-assessment/template/index.vue`
- `src/pages/public/final-review/[token].vue`
- `src/service/api/assessment.ts`
- `src/service/api/url.ts`
- `src/types/app.ts`

## 后续待继续项

- 将导师填写的总体评价内容与公开链接评分内容拆分处理。
- 调整默认总体考评模板，补充“工作态度”等导师汇总维度。
- 继续收敛公共评分页与培训详情页的剩余视觉差异。
