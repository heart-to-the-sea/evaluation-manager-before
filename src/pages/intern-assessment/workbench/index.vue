<script setup lang="ts">
import { computed } from 'vue';
import MarkdownIt from 'markdown-it';
import { NButton, NInput, NModal, NTooltip } from 'naive-ui';
import InfoPageLayout from '@/components/pages/InfoPageLayout.vue';
import InfoGridCard from '@/components/common/InfoGridCard.vue';
import DictTag from '@/components/common/DictTag.vue';
import MarkdownEditor from '@/components/common/MarkdownEditor.vue';
import WorkbenchDailyCalendar from '@/components/features/intern-assessment/WorkbenchDailyCalendar.vue';

definePageMeta({
  title: '学员工作台'
});

// Markdown 渲染器
const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true
});

function renderMarkdown(text: string): string {
  return md.render(text || '');
}

// 模拟数据
const mockPathInfo = {
  name: '2026年新员工入职培训考核',
  startedAt: '2026-03-01',
  expectedEndAt: '2026-06-30'
};

const mockStages = [
  { id: '1', name: '第一阶段：基础培训', status: 'passed', progress: 100, startedAt: '2026-03-01' },
  { id: '2', name: '第二阶段：业务学习', status: 'in_progress', progress: 65, startedAt: '2026-04-08' },
  { id: '3', name: '第三阶段：实战演练', status: 'pending', progress: 0, startedAt: null },
  { id: '4', name: '第四阶段：综合考核', status: 'pending', progress: 0, startedAt: null }
];

// 主题颜色
const themeVars = computed(() => ({
  infoColor: 'rgb(32 128 240)',
  successColor: 'rgb(82 196 26)',
  warningColor: 'rgb(250 173 20)',
  errorColor: 'rgb(245 34 45)'
}));

// 获取阶段视觉样式
function getStageVisual(stage: typeof mockStages[0]) {
  const vars = themeVars.value;
  switch (stage.status) {
    case 'passed':
      return {
        dotColor: vars.successColor,
        ringColor: 'rgb(82 196 26 / 18%)',
        borderColor: 'rgb(82 196 26 / 34%)',
        lineColor: 'rgb(82 196 26 / 56%)'
      };
    case 'in_progress':
      return {
        dotColor: vars.infoColor,
        ringColor: 'rgb(32 128 240 / 18%)',
        borderColor: 'rgb(32 128 240 / 34%)',
        lineColor: 'rgb(32 128 240 / 44%)'
      };
    case 'failed':
      return {
        dotColor: vars.errorColor,
        ringColor: 'rgb(245 34 45 / 18%)',
        borderColor: 'rgb(245 34 45 / 34%)',
        lineColor: 'rgb(245 34 45 / 44%)'
      };
    default:
      return {
        dotColor: 'rgb(var(--layout-bg-color))',
        ringColor: 'rgb(var(--border-color) / 18%)',
        borderColor: 'rgb(var(--border-color) / 80%)',
        lineColor: 'rgb(var(--border-color) / 84%)'
      };
  }
}

// 获取节点样式
function getStageDotStyle(stage: typeof mockStages[0]) {
  const visual = getStageVisual(stage);
  return {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    background: visual.dotColor,
    border: `1px solid ${visual.borderColor}`,
    boxShadow: `0 0 0 3px ${visual.ringColor}, inset 0 0 0 1.5px rgb(var(--container-bg-color)), 0 4px 12px rgb(15 23 42 / 10%)`,
    flexShrink: 0,
    cursor: 'pointer',
    display: 'inline-block',
    transition: 'all 0.2s ease'
  };
}

// 获取连接线样式
function getStageLineStyle(stage: typeof mockStages[0]) {
  const visual = getStageVisual(stage);
  return {
    width: '36px',
    height: '3px',
    margin: '0 6px',
    borderRadius: '999px',
    background: visual.lineColor,
    boxShadow: `inset 0 0 0 1px ${visual.borderColor}`,
    flexShrink: 0,
    display: 'inline-block',
    verticalAlign: 'middle',
    alignSelf: 'center'
  };
}

// 获取边界节点样式
function getBoundaryDotStyle(isStart: boolean, hasContent: boolean) {
  if (hasContent) {
    return {
      width: '16px',
      height: '16px',
      borderRadius: '50%',
      background: themeVars.value.infoColor,
      border: `1px solid rgb(32 128 240 / 34%)`,
      boxShadow: `0 0 0 3px rgb(32 128 240 / 18%), inset 0 0 0 1.5px rgb(var(--container-bg-color)), 0 4px 12px rgb(15 23 42 / 10%)`,
      flexShrink: 0,
      cursor: 'pointer',
      display: 'inline-block',
      transition: 'all 0.2s ease'
    };
  }
  return {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    background: 'rgb(var(--layout-bg-color))',
    border: `1px solid rgb(var(--border-color) / 80%)`,
    boxShadow: `0 0 0 3px rgb(var(--border-color) / 18%), inset 0 0 0 1.5px rgb(var(--container-bg-color)), 0 4px 12px rgb(15 23 42 / 10%)`,
    flexShrink: 0,
    cursor: 'pointer',
    display: 'inline-block',
    transition: 'all 0.2s ease'
  };
}

// 获取边界连接线样式
function getBoundaryLineStyle(hasContent: boolean) {
  if (hasContent) {
    return {
      width: '36px',
      height: '3px',
      margin: '0 6px',
      borderRadius: '999px',
      background: 'rgb(32 128 240 / 44%)',
      boxShadow: `inset 0 0 0 1px rgb(32 128 240 / 34%)`,
      flexShrink: 0,
      display: 'inline-block'
    };
  }
  return {
    width: '36px',
    height: '3px',
    margin: '0 6px',
    borderRadius: '999px',
    background: 'rgb(var(--border-color) / 84%)',
    boxShadow: `inset 0 0 0 1px rgb(var(--border-color) / 80%)`,
    flexShrink: 0,
    display: 'inline-block'
  };
}

const mockCurrentStage = {
  name: '第二阶段：业务学习',
  status: '进行中',
  statusType: 'warning' as const,
  timingStatus: '正常',
  timingStatusType: 'success' as const,
  studyDays: '5-7天',
  duration: '已进行 8 天',
  startDate: '2026-04-01',
  description: `## 阶段学习任务清单

### 一、基础理论模块（共15项）

1. **流程管理基本概念** — 掌握流程的定义、要素、分类及作用
2. **业务流程发展历程** — 了解从泰勒科学管理到现代流程管理的演进
3. **流程管理核心理论** — 学习波特价值链、彼得斯业务流程重组等经典理论
4. **流程体系化方法论** — 掌握ARIS、PEPI等主流流程建模方法论
5. **流程管理六大要素** — 输入、活动、输出、责任人、时效、指标
6. **流程绩效评估模型** — 学习平衡计分卡、关键绩效指标在流程中的应用
7. **流程标准化建设** — 掌握流程文档编写规范和标准化模板
8. **流程持续改进方法** — PDCA循环、精益生产、六西格玛在流程管理中的应用
9. **流程风险控制** — 识别流程风险点，建立风险预警机制
10. **流程信息化基础** — 了解BPM系统在流程管理中的定位和作用
11. **流程审计方法** — 掌握流程合规性审计和有效性评估方法
12. **流程owner职责** — 明确流程负责人在流程生命周期中的职责
13. **跨部门流程协同** — 学习打破部门壁垒的流程协同机制
14. **流程知识管理体系** — 建立流程知识积累和共享机制
15. **流程成熟度评估** — 掌握流程成熟度模型及评估方法

### 二、BPMN2.0建模模块（共12项）

16. **BPMN2.0规范概述** — 了解BPMN的发展历程和规范框架
17. **事件类型与应用** — 开始事件、结束事件、中间事件的类型及使用场景
18. **活动节点配置** — 任务、子流程、调用活动的配置方法
19. **网关类型详解** — 排他网关、并行网关、包容网关、事件网关的选择
20. **泳池与泳道设计** — 公共泳池、私有泳池、泳道布局规范
21. **信号与消息流** — 跨泳池通信的建模方法和规范
22. **事务与补偿机制** — 事务边界和补偿事件的处理逻辑
23. **可执行流程建模** — 从业务视角到可执行流程的转换技巧
24. **流程版本管理** — 流程模型的版本控制和变更管理
25. **流程模拟与仿真** — 使用工具进行流程性能模拟分析
26. **流程布局美化** — 优化流程图的视觉呈现和布局
27. **流程文档生成** — 自动生成符合规范的流程说明文档

### 三、工具实操模块（共10项）

28. **主流BPM工具介绍** — Visio、ProcessOne、Camunda等工具对比
29. **ProcessOne界面操作** — 流程建模工具的基本操作和快捷键
30. **流程元素添加与编辑** — 拖拽式建模的技巧和注意事项
31. **流程属性配置** — 节点属性、连接线属性、泳道属性设置
32. **流程校验与调试** — 发现并修复流程建模中的常见错误
33. **流程导出与打印** — 高清流程图导出和打印排版设置
34. **团队协作功能** — 流程模型的共享、评论和版本对比
35. **流程模板库使用** — 利用模板快速构建标准流程
36. **与其他系统集成** — 流程与OA、ERP系统的集成方式
37. **自动化脚本编写** — 流程中的脚本任务和表达式配置

### 四、实战案例模块（共8项）

38. **制造业供应链流程** — 采购、生产、销售、库存全链路流程分析
39. **服务业业务流程** — 客户服务、投诉处理、售后支持流程设计
40. **审批流程优化** — 多级审批、分支审批、委托审批机制设计
41. **电商订单处理流程** — 从下单到履约的全渠道订单管理
42. **人力资源流程** — 入转调离、绩效考核、薪酬核算流程
43. **财务管理流程** — 预算管理、费用报销、合同审批流程
44. **跨企业协同流程** — 供应链上下游的协同流程设计
45. **异常处理流程** — 流程中断、驳回、回退的异常处理机制

### 五、综合提升模块（共5项）

46. **流程优化工作坊** — 主持流程优化研讨会的技巧和方法
47. **流程指标体系建设** — 设计流程监控仪表盘和预警指标
48. **流程变革管理** — 推动流程变革的策略和沟通技巧
49. **流程最佳实践** — 总结提炼可复用的流程优化方法论
50. **阶段考核准备** — 回顾总结，准备参加阶段考核测评
`,
  assessmentDescription: `## 阶段考核说明

### 一、考核总体安排

| 考核模块 | 考核形式 | 时长 | 分值 | 占比 |
|---------|---------|------|------|------|
| 理论笔试 | 闭卷笔试 | 90分钟 | 100分 | 40% |
| 实操考核 | 上机操作 | 120分钟 | 100分 | 35% |
| 报告撰写 | 笔试 | 60分钟 | 100分 | 25% |

### 二、理论笔试大纲

**考核内容**：

1. **流程管理基础概念**（15分）
   - 流程的定义、要素、分类
   - 流程管理与组织变革的关系
   - 流程标准化建设的意义和方法

2. **BPMN2.0规范要点**（25分）
   - 事件类型：开始事件、结束事件、中间事件
   - 活动类型：任务、子流程、调用活动
   - 网关类型：排他、并行、包容、事件网关
   - 泳池泳道：公有泳池、私有泳池、跨泳池通信

3. **流程建模方法论**（20分）
   - ARIS方法论的核心框架
   - 价值链分析方法
   - 流程优化策略与技巧

4. **流程绩效评估**（20分）
   - 关键绩效指标设计
   - 流程效率计算方法
   - 平衡计分卡在流程管理中的应用

5. **流程工具软件**（20分）
   - 主流BPM工具的功能特点
   - 流程建模规范和标准
   - 流程文档编写规范

**题型分布**：单选题20题（每题2分）、多选题10题（每题3分）、判断题10题（每题1分）、简答题4题（共20分）

### 三、实操考核大纲

**考核形式**：上机操作，使用指定流程建模工具

**考核任务**：

任务一：业务流程建模（40分）
- 根据业务场景描述，绘制完整的业务流程图
- 正确使用各类事件、活动、网关元素
- 合理设置泳池和泳道
- 注意流程布局的美观性和规范性

任务二：流程分析与优化（35分）
- 识别现有流程中的瓶颈和问题
- 提出优化方案并说明理由
- 使用优化后的元素重新建模

任务三：流程仿真分析（25分）
- 配置流程仿真参数
- 运行仿真并分析结果
- 根据仿真数据提出改进建议

**评分标准**：

| 评分维度 | 权重 | 评分要点 |
|---------|------|---------|
| 规范性 | 30% | BPMN规范遵循程度 |
| 完整性 | 25% | 流程要素完整覆盖 |
| 优化合理性 | 25% | 问题识别和优化方案 |
| 工具熟练度 | 20% | 操作效率和技巧运用 |

### 四、报告撰写大纲

**考核形式**：笔试，撰写流程分析报告

**题目要求**：

假设你是某制造企业流程管理部门负责人，需要对生产采购流程进行优化分析。

**报告结构要求**：

1. **现状问题诊断**（25分）
   - 描述现有流程的基本情况
   - 识别流程中存在的主要问题
   - 分析问题产生的原因

2. **原因分析**（25分）
   - 运用流程分析方法进行根因分析
   - 引用相关数据支撑分析结论
   - 对比行业最佳实践找出差距

3. **优化方向建议**（30分）
   - 提出具体的优化措施
   - 说明优化措施的实施步骤
   - 评估优化措施的可行性和风险

4. **预期效果预测**（20分）
   - 量化优化后的预期效果
   - 设计效果监控指标
   - 制定持续改进计划

**撰写规范**：
- 字数要求：不少于3000字
- 格式要求：Word文档，A4页面，正文宋体小四号字
- 提交要求：纸质版，附流程图和表格

### 五、合格标准与成绩评定

**合格分数线**：60分（总分100分）

**成绩等级**：

| 等级 | 分数区间 | 说明 |
|-----|---------|------|
| 优秀 | 90-100分 | 全面掌握，可独立开展流程管理工作 |
| 良好 | 80-89分 | 较好掌握，可在指导下开展流程管理工作 |
| 中等 | 70-79分 | 基本掌握，需加强实践锻炼 |
| 及格 | 60-69分 | 初步掌握，需继续学习提升 |
| 不及格 | 60分以下 | 未达到基本要求，需重修 |

**成绩应用**：
- 阶段考核成绩计入培训档案
- 作为阶段学习效果评定的重要依据
- 成绩优秀者可获得流程管理专员认证资格
- 考核未通过者需参加补考，补考费用自理

### 六、考核注意事项

**考前准备**：
1. 提前熟悉考场环境和考试系统
2. 准备好身份证、准考证等证件
3. 携带黑色签字笔、橡皮等文具
4. 禁止携带手机、电子词典等电子设备

**考试纪律**：
1. 准时入场，迟到15分钟不得入场
2. 遵守考场规则，保持安静
3. 独立完成考试，严禁作弊
4. 考试结束信号发出后立即停笔

**突发情况处理**：
1. 如遇系统故障，及时举手示意监考人员
2. 如有身体不适，立即报告监考人员
3. 试卷字迹不清可举手提问
4. 不得擅自离开考场（除紧急情况）`
};

const mockLearningTasks = [
  { title: '业务流程文档学习', type: '学习资料', fileType: 'doc', url: '#' },
  { title: '业务系统操作视频', type: '视频课程', fileType: 'video', url: '#' },
  { title: 'BPMN建模规范手册', type: '学习资料', fileType: 'pdf', url: '#' },
  { title: '流程管理培训课件', type: '课件', fileType: 'ppt', url: '#' },
  { title: '业务流程考核', type: '考核任务', fileType: 'exam', url: '#' }
];

const mockAssessmentTasks = [
  { title: '选择题-业务知识', type: '考核', difficulty: '简单', questionCount: 10, score: 100 },
  { title: '简答题-流程理解', type: '考核', difficulty: '中等', questionCount: 5, score: 50 }
];

// 判断是否为多媒体文件
function isMultimedia(fileType: string): boolean {
  return ['video', 'audio'].includes(fileType);
}

const mockReports = [
  { date: '2026-04-24', content: '## 今日学习总结\n\n今天系统学习了**业务流程建模**的核心知识，主要内容包括：\n\n- BPMN2.0规范要点\n- 流程图基本元素（事件、活动、网关）\n- 泳池与泳道的设置方法\n\n### 重点掌握\n\n1. **开始事件**和**结束事件**的区别\n2. **排他网关**与**并行网关**的使用场景\n3. 流程图的**布局规范**和**命名约定**\n\n> 练习时长：约2小时，完成课后习题12道。\n\n明天继续学习流程优化相关内容。', plan: '继续深入学习流程C' },
  { date: '2026-04-23', content: '## 流程文档阅读笔记\n\n阅读了《业务流程管理实战指南》第三、四章，重点内容：\n\n### 第三章：流程规划\n- 现有流程诊断方法\n- 流程瓶颈识别技术\n- 优化机会分析框架\n\n### 第四章：流程设计原则\n- **增值活动** vs **非增值活动**\n- 流程周期时间计算\n- 资源配置优化思路\n\n```\n关键公式：\n流程效率 = 增值时间 / 总周期时间 × 100%\n```', plan: '开始练习系统操作' },
  { date: '2026-04-22', content: '# 培训材料学习记录\n\n## 第一章节：流程管理基础\n\n### 学习内容\n\n1. **流程定义**：流程是一系列相互关联的活动，将输入转化为输出\n2. **流程要素**：输入、输出、活动、责任人、时效、指标\n3. **流程分类**：\n   - 主流程\n   - 子流程\n   - 支持流程\n\n### 心得体会\n\n今天的理论内容比较抽象，建议结合案例理解。', plan: '加快阅读速度' },
  { date: '2026-04-21', content: '**复习笔记 - 流程建模工具**\n\n今天完成了培训系统的前三套模拟题，正确率87%。\n\n| 题型 | 题数 | 正确率 |\n|------|------|--------|\n| 选择题 | 30 | 90% |\n| 判断题 | 15 | 93% |\n| 简答题 | 5 | 60% |\n\n### 薄弱环节\n- 网关类型的应用场景\n- 信号与消息流的区别\n\n**明日计划**：重点复习这两个知识点。', plan: '向同事请教疑难问题' },
  { date: '2026-04-20', content: '## 业务培训课程笔记\n\n### 课程主题\n\n供应链业务流程优化\n\n### 核心要点\n\n1. **SCOR模型**概述\n2. **供应链流程图**绘制方法\n3. 供应商评估指标体系\n\n### 实际案例\n\n某制造企业的采购流程优化案例分析：\n\n- 优化前：平均审批时间72小时\n- 优化后：平均审批时间18小时\n- 优化幅度：75%\n\n> 关键措施：实施分级审批机制 + 电子化审批流程', plan: '整理培训笔记' },
  { date: '2026-04-19', content: '## 系统功能测试报告\n\n### 测试范围\n\n客户管理模块全部功能点\n\n### 测试结果\n\n- 测试用例：45个\n- 通过：42个\n- 失败：3个（已提交bug单）\n\n### 发现的问题\n\n1. **权限问题**：部分角色无法查看客户列表\n2. **数据展示**：客户详情页加载慢（约5秒）\n3. **导出功能**：Excel导出偶发失败\n\n### 建议\n\n需要开发团队尽快修复优先级1的bug。', plan: '提交问题反馈' },
  { date: '2026-04-18', content: '# 后台管理功能学习\n\n## 学习内容\n\n### 1. 用户权限管理\n\n- 角色定义与权限分配\n- 数据权限与功能权限的区别\n\n### 2. 组织架构管理\n\n```\n部门层级结构：\n总公司\n├── 华东区\n│   ├── 上海分公司\n│   └── 南京分公司\n└── 华南区\n    ├── 广州分公司\n    └── 深圳分公司\n```\n\n### 3. 系统配置\n\n各项参数的设置方法和作用。\n\n明天继续学习报表配置。', plan: '继续深入学习权限模块' },
  { date: '2026-04-17', content: '## 操作手册第三章笔记\n\n### 主要内容\n\n报表定制与数据分析\n\n### 重点知识\n\n**常用报表类型**：\n\n1. 明细表 - 逐条展示数据\n2. 汇总表 - 按维度聚合统计\n3. 交叉表 - 多维度交叉分析\n4. 图表 - 可视化展示\n\n**筛选条件设置**：\n\n- 日期范围筛选\n- 部门筛选\n- 状态筛选\n\n> 建议制作常用报表模板，方便以后快速生成。', plan: '制作思维导图帮助理解' },
  { date: '2026-04-16', content: '### 模拟考核总结\n\n**考核成绩**：85分\n\n#### 知识点分布\n\n| 章节 | 得分率 |\n|------|--------|\n| 流程基础 | 95% |\n| BPMN规范 | 80% |\n| 工具使用 | 85% |\n| 案例分析 | 75% |\n\n#### 需要加强\n\n- 并行网关的并发场景设计\n- 多泳池流程的交互关系\n\n**改进计划**：每天练习一道建模题。', plan: '加强简答题训练' },
  { date: '2026-04-15', content: '## SQL学习笔记\n\n### 今日重点\n\n统计查询与数据汇总\n\n### 常用语法\n\n```sql\n-- 按部门统计用户数量\nSELECT \n    dept_id,\n    COUNT(*) as user_count\nFROM users\nGROUP BY dept_id\nHAVING COUNT(*) > 10;\n```\n\n### 练习题\n\n完成8道SQL练习题，全部正确。\n\n### 难点\n\n子查询和表连接的综合运用。\n\n继续加油！', plan: '多练习SQL语句编写' },
  { date: '2026-04-14', content: '# 团队周会纪要\n\n## 会议主题\n\n项目进展汇报\n\n## 参会人员\n\n- 张经理（项目经理）\n- 李工（开发负责人）\n- 王工（测试负责人）\n- 我（培训学员）\n\n## 主要内容\n\n1. **项目进度**：当前处于开发阶段，预计6月上线\n2. **下周计划**：完成用户模块开发\n3. **需要协调**：测试环境申请\n\n## 我的任务\n\n继续学习系统操作，配合测试工作。', plan: '准备下周工作计划' },
  { date: '2026-04-13', content: '## 用户管理模块总结\n\n### 功能模块\n\n1. 用户注册与登录\n2. 密码管理与找回\n3. 个人信息维护\n4. 安全设置\n\n### 权限配置\n\n- **超级管理员**：全部权限\n- **部门管理员**：本部门用户管理\n- **普通用户**：查看和修改个人信息\n\n### 架构图\n\n```\n用户 -> 角色 -> 权限\n  |        |\n  +--------+\n  多对多关系\n```\n\n理解权限系统的核心逻辑。', plan: '画权限架构图帮助理解' },
  { date: '2026-04-12', content: '# 系统设计文档笔记\n\n## 总体架构\n\n系统采用**前后端分离**架构：\n\n- 前端：Vue3 + Element Plus\n- 后端：Spring Boot\n- 数据库：MySQL 8.0\n\n## 核心模块\n\n| 模块 | 负责团队 | 状态 |\n|------|----------|------|\n| 用户管理 | 张工 | 已完成 |\n| 权限管理 | 李工 | 开发中 |\n| 流程管理 | 王工 | 设计中 |\n\n## 数据库设计\n\n- 了解三范式原则\n- 掌握ER图绘制方法\n- 熟悉索引创建原则', plan: '查阅相关技术文档' },
  { date: '2026-04-11', content: '**第一阶段知识测试复盘**\n\n### 成绩分析\n\n- 总分：92分\n- 排名：第3名/25人\n\n### 各部分得分\n\n1. 理论部分：45/50\n2. 实际操作：42/50\n\n### 错误分析\n\n| 题号 | 知识点 | 正确答案 | 我的答案 |\n|------|--------|----------|----------|\n| 15 | 流程分类 | B | C |\n| 23 | 网关类型 | A | B |\n\n### 改进措施\n\n1. 重新学习流程分类标准\n2. 理解各类网关的适用场景', plan: '整理错题本' },
  { date: '2026-04-10', content: '## 报表功能学习\n\n### 报表类型\n\n1. **销售报表**\n   - 日报、周报、月报\n   - 趋势分析图\n\n2. **业绩报表**\n   - 部门业绩排名\n   - 人员业绩对比\n\n3. **库存报表**\n   - 实时库存查询\n   - 预警报表\n\n### 制作流程\n\n1. 明确报表需求\n2. 确定数据源\n3. 设计布局\n4. 配置筛选条件\n5. 测试验证\n\n> 练习：完成销售月报的制作。', plan: '练习不同类型报表制作' },
  { date: '2026-04-09', content: '# 业务培训讲座纪要\n\n## 讲座主题\n\n企业数字化转型与流程管理\n\n## 主讲人\n\n陈博士（资深顾问）\n\n## 核心观点\n\n1. **数字化转型**是企业的必由之路\n2. **流程管理**是数字化的基础\n3. 数据驱动决策是方向\n\n## 关键启发\n\n> “好的流程设计不是要消灭变化，而是要能够快速响应变化。”\n\n### 行动建议\n\n- 建立流程标准化意识\n- 培养数据思维\n- 主动学习新技术', plan: '整理培训重点内容' },
  { date: '2026-04-08', content: '## 第二阶段启动\n\n### 阶段目标\n\n- 掌握业务流程管理核心能力\n- 完成至少3个实战项目\n- 通过阶段考核（≥85分）\n\n### 学习计划\n\n| 周次 | 主题 | 产出 |\n|------|------|------|\n| 第1周 | 流程基础 | 学习笔记 |\n| 第2周 | BPMN建模 | 流程图×3 |\n| 第3周 | 工具使用 | 实操报告 |\n| 第4周 | 综合应用 | 项目报告 |\n\n### 学习资源\n\n- 培训教材（已领取）\n- 在线课程（已激活）\n- 实践平台（账号已开通）\n\n加油！', plan: '制定第二阶段学习计划' },
  { date: '2026-04-07', content: '# 第一阶段总结报告\n\n## 培训回顾\n\n### 学习内容\n\n- 企业文化与制度\n- 基础业务流程\n- 系统操作入门\n- 团队协作方法\n\n### 收获与成长\n\n1. 熟悉了公司业务流程\n2. 掌握了核心系统操作\n3. 建立了团队协作意识\n\n### 不足与改进\n\n- 专业知识储备不足\n- 沟通表达需加强\n- 时间管理有待提升\n\n### 下阶段计划\n\n重点学习业务流程管理专业知识，争取优异成绩。', plan: '准备第二阶段学习' },
  { date: '2026-04-06', content: '**培训内容复习**\n\n### 重点知识回顾\n\n1. **PDCA循环**：Plan-Do-Check-Act\n2. **5W1H分析法**：What-Why-Who-When-Where-How\n3. **SWOT分析**：优势-劣势-机会-威胁\n\n### 练习情况\n\n完成复习测试题20道，正确率90%。\n\n### 疑问记录\n\n- 流程优化与流程再造的区别？\n- 等待明天请教培训老师。\n\n> 温故而知新。', plan: '重新整理培训笔记' },
  { date: '2026-04-05', content: '## 流程图绘制实践\n\n### 绘制内容\n\n客户订单处理流程\n\n### 流程步骤\n\n1. 客户下单\n2. 订单审核\n3. 库存确认\n4. 拣货出库\n5. 物流配送\n6. 客户签收\n7. 售后服务\n\n### 问题记录\n\n- 网关设置位置需要优化\n- 异常流程需要补充\n\n> 需要参考实际业务进行调整。', plan: '继续完善流程文档' },
  { date: '2026-04-04', content: '### 阶段考核\n\n**考试时间**：14:00-16:00\n\n**考试内容**：\n\n| 模块 | 时长 | 分值 |\n|------|------|------|\n| 理论测试 | 60分钟 | 40分 |\n| 实操考核 | 60分钟 | 40分 |\n| 综合问答 | 30分钟 | 20分 |\n\n### 考前准备\n\n- 复习笔记整理完成\n- 模拟题完成3套\n- 流程图模板准备就绪\n\n### 注意事项\n\n- 仔细阅读题目要求\n- 合理分配考试时间\n- 注意操作规范\n\n相信自己！', plan: '等待考核结果' },
  { date: '2026-04-03', content: '## 模拟测试复盘\n\n### 测试结果\n\n- 理论得分：38/40\n- 实操得分：35/40\n- 总分：73/80\n\n### 主要失分点\n\n1. 时间估算题（概念理解有偏差）\n2. 流程图绘制题（布局不够规范）\n\n### 改进措施\n\n> “Practice makes perfect.”\n\n- 多做练习题，特别是时间计算类\n- 临摹优秀流程图作品\n- 注意BPMN规范细节\n\n### 明日计划\n\n参加正式考核，争取90分以上！', plan: '提高答题速度' },
  { date: '2026-04-02', content: '# 考前冲刺\n\n## 重点复习\n\n### 理论部分\n\n- [ ] 流程管理基础概念\n- [ ] BPMN规范要点\n- [ ] 流程优化方法\n- [ ] 绩效评估指标\n\n### 实操部分\n\n- [ ] 流程图绘制\n- [ ] 工具使用\n- [ ] 案例分析\n\n### 复习时间安排\n\n- 上午：理论复习\n- 下午：实操练习\n- 晚上：错题整理\n\n## 心理建设\n\n保持平和心态，相信自己的努力！\n\n> 加油！明天考核一定能过！', plan: '重点复习难点部分' },
  { date: '2026-04-01', content: '## 第一阶段启动\n\n### 开班仪式\n\n今天参加了第一阶段基础培训的开幕式，HR总监介绍了公司发展历程和人才战略。\n\n### 培训安排\n\n| 日期 | 内容 | 讲师 |\n|------|------|------|\n| 04.01-04.07 | 基础理论 | 王老师 |\n| 04.08-04.14 | 系统操作 | 李老师 |\n| 04.15-04.21 | 业务流程 | 张老师 |\n\n### 学习目标\n\n1. 掌握基础理论知识\n2. 熟练操作系统平台\n3. 了解核心业务流程\n4. 通过阶段考核（≥80分）\n\n### 第一天感悟\n\n培训讲师经验丰富，讲课深入浅出。\n\n认真听讲，做好笔记，积极互动！\n\n期待接下来的学习旅程。', plan: '认真完成培训任务' },
  { date: '2026-03-31', content: '## 入职手续办理\n\n### 已完成\n\n- [x] 劳动合同签署\n- [x] 证件照采集\n- [x] 门禁卡办理\n- [x] 工牌领取\n- [x] 邮箱申请\n\n### 待完成\n\n- [ ] 工位电脑配置（明天IT部门协助）\n\n### 重要信息\n\n- **工号**：EMP202604001\n- **部门**：业务培训部\n- **导师**：张老师\n\n感谢HR同事的耐心指导，手续办理顺利完成。\n\n明天正式开始培训！', plan: '准备开始培训' },
  { date: '2026-03-30', content: '# 员工手册阅读\n\n## 公司愿景\n\n成为行业领先的数字化服务提供商。\n\n## 企业价值观\n\n1. **客户至上**：始终把客户需求放在首位\n2. **创新发展**：鼓励创新，包容试错\n3. **协作共赢**：团队合作，共同成长\n4. **诚信正直**：诚实守信，廉洁从业\n\n## 规章制度\n\n- 考勤制度\n- 报销制度\n- 绩效考核制度\n- 保密制度\n\n## 心得体会\n\n认同公司文化，愿意与公司共同成长。\n\n> 诚信做人，专心做事。', plan: '了解公司规章制度' },
  { date: '2026-03-29', content: '## 新员工欢迎会\n\n### 活动流程\n\n1. 总经理致辞\n2. 部门介绍\n3. 新员工自我介绍\n4. 抽奖互动\n\n### 参会人员\n\n- 总经理\n- 各部门负责人\n- 新员工12人\n\n### 印象深刻的环节\n\n> 总经理分享了自己的职业成长经历，激励我们要敢于挑战、勇于担当。\n\n### 认识的新同事\n\n- 市场部：小李\n- 技术部：小王\n- 财务部：小刘\n\n期待未来与大家共同工作！', plan: '认识更多同事' },
  { date: '2026-03-28', content: '## 电脑环境配置\n\n### 已完成\n\n- [x] Windows系统安装\n- [x] 办公软件（Office、PDF阅读器）\n- [x] 通讯工具（钉钉、企业微信）\n- [x] 开发工具（VS Code、Git）\n\n### 待处理\n\n- [ ] 网络权限（需联系IT部门）\n- [ ] 打印机驱动\n- [ ] VPN配置\n\n### 联系方式\n\n| 类型 | 方式 |\n|------|------|\n| 固话 | 8001 |\n| 邮箱 | it-support@company.com |\n\nIT部门很忙，但态度很好。\n\n耐心等待中...', plan: '联系IT部门解决' },
  { date: '2026-03-27', content: '## 培训前准备\n\n### 物资准备\n\n- [x] 笔记本（已购买）\n- [x] 文具套装\n- [x] 文件袋\n- [x] 水杯\n\n### 知识准备\n\n- [x] 了解公司背景\n- [x] 阅读岗位职责说明\n- [ ] 复习相关业务知识\n\n### 心理准备\n\n调整心态，保持空杯精神。\n\n认真学，多思考，积极问。\n\n### 期望\n\n通过培训快速融入团队，掌握岗位技能，为公司创造价值。\n\n> 准备就绪，等待培训开始！', plan: '等待培训开始' }
];

// 模拟当日已提交
const hasTodayReport = ref(true);

// 弹窗状态
const showReportModal = ref(false);
const reportForm = reactive({
  content: '',
  plan: ''
});

// 申请考核弹窗状态
const showAssessmentModal = ref(false);
const assessmentForm = reactive({
  reason: '已完成阶段任务，申请考核'
});

// 当前编辑的日报
const currentEditReport = ref<typeof mockReports[0] | null>(null);

// 查看日报弹窗状态
const showViewReportModal = ref(false);
const currentViewReport = ref<typeof mockReports[0] | null>(null);

function openReportModal() {
  // 获取今日日报数据填充表单
  const todayReport = mockReports.find(r => r.date === '2026-04-24');
  if (todayReport) {
    currentEditReport.value = todayReport;
    reportForm.content = todayReport.content;
    reportForm.plan = todayReport.plan;
  }
  showReportModal.value = true;
}

function closeReportModal() {
  showReportModal.value = false;
  currentEditReport.value = null;
}

function openViewReportModal(report: typeof mockReports[0]) {
  currentViewReport.value = report;
  showViewReportModal.value = true;
}

const currentViewReportContent = computed(() => currentViewReport.value?.content || '');

function closeViewReportModal() {
  showViewReportModal.value = false;
  currentViewReport.value = null;
}

function handleSubmitReport() {
  // 提交逻辑
  console.log('提交日报:', reportForm);
  hasTodayReport.value = true;
  closeReportModal();
}

function openAssessmentModal() {
  showAssessmentModal.value = true;
}

function closeAssessmentModal() {
  showAssessmentModal.value = false;
}

function handleSubmitAssessment() {
  console.log('申请考核:', assessmentForm);
  closeAssessmentModal();
}

// 模拟日历数据 - 包含多个阶段
const mockCalendar = {
  pathId: '1',
  startDate: '2026-04-01',
  endDate: '2026-06-30',
  days: [
    // 第一阶段 - 绿色
    { date: '2026-04-01', stageName: '第一阶段：基础培训', stageColor: '#52c41a', submittedFlag: true, expectedReportFlag: true, holidayFlag: false },
    { date: '2026-04-02', stageName: '第一阶段：基础培训', stageColor: '#52c41a', submittedFlag: true, expectedReportFlag: true, holidayFlag: false },
    { date: '2026-04-03', stageName: '第一阶段：基础培训', stageColor: '#52c41a', submittedFlag: true, expectedReportFlag: true, holidayFlag: false },
    { date: '2026-04-04', stageName: '第一阶段：基础培训', stageColor: '#52c41a', submittedFlag: true, expectedReportFlag: true, holidayFlag: false },
    { date: '2026-04-05', stageName: '第一阶段：基础培训', stageColor: '#52c41a', submittedFlag: true, expectedReportFlag: true, holidayFlag: false },
    { date: '2026-04-06', stageName: '第一阶段：基础培训', stageColor: '#52c41a', submittedFlag: true, expectedReportFlag: true, holidayFlag: false },
    { date: '2026-04-07', stageName: '第一阶段：基础培训', stageColor: '#52c41a', submittedFlag: false, expectedReportFlag: false, holidayFlag: true },
    // 第二阶段 - 蓝色
    { date: '2026-04-08', stageName: '第二阶段：业务学习', stageColor: '#1890ff', submittedFlag: true, expectedReportFlag: true, holidayFlag: false },
    { date: '2026-04-09', stageName: '第二阶段：业务学习', stageColor: '#1890ff', submittedFlag: true, expectedReportFlag: true, holidayFlag: false },
    { date: '2026-04-10', stageName: '第二阶段：业务学习', stageColor: '#1890ff', submittedFlag: true, expectedReportFlag: true, holidayFlag: false },
    { date: '2026-04-11', stageName: '第二阶段：业务学习', stageColor: '#1890ff', submittedFlag: false, expectedReportFlag: true, holidayFlag: false },
    { date: '2026-04-12', stageName: '第二阶段：业务学习', stageColor: '#1890ff', submittedFlag: false, expectedReportFlag: true, holidayFlag: false },
    { date: '2026-04-13', stageName: '第二阶段：业务学习', stageColor: '#1890ff', submittedFlag: false, expectedReportFlag: false, holidayFlag: true },
    // 第三阶段 - 橙色
    { date: '2026-04-14', stageName: '第三阶段：实战演练', stageColor: '#fa8c16', submittedFlag: true, expectedReportFlag: true, holidayFlag: false },
    { date: '2026-04-15', stageName: '第三阶段：实战演练', stageColor: '#fa8c16', submittedFlag: true, expectedReportFlag: true, holidayFlag: false },
    { date: '2026-04-16', stageName: '第三阶段：实战演练', stageColor: '#fa8c16', submittedFlag: true, expectedReportFlag: true, holidayFlag: false },
    { date: '2026-04-17', stageName: '第三阶段：实战演练', stageColor: '#fa8c16', submittedFlag: false, expectedReportFlag: true, holidayFlag: false },
    { date: '2026-04-18', stageName: '第三阶段：实战演练', stageColor: '#fa8c16', submittedFlag: false, expectedReportFlag: true, holidayFlag: false },
    { date: '2026-04-19', stageName: '第三阶段：实战演练', stageColor: '#fa8c16', submittedFlag: false, expectedReportFlag: false, holidayFlag: true },
    // 第四阶段 - 紫色
    { date: '2026-04-20', stageName: '第四阶段：综合考核', stageColor: '#722ed1', submittedFlag: true, expectedReportFlag: true, holidayFlag: false },
    { date: '2026-04-21', stageName: '第四阶段：综合考核', stageColor: '#722ed1', submittedFlag: true, expectedReportFlag: true, holidayFlag: false },
    { date: '2026-04-22', stageName: '第四阶段：综合考核', stageColor: '#722ed1', submittedFlag: true, expectedReportFlag: true, holidayFlag: false },
    { date: '2026-04-23', stageName: '第四阶段：综合考核', stageColor: '#722ed1', submittedFlag: false, expectedReportFlag: true, holidayFlag: false },
    { date: '2026-04-24', stageName: '第四阶段：综合考核', stageColor: '#722ed1', submittedFlag: false, expectedReportFlag: true, holidayFlag: false },
    { date: '2026-04-25', stageName: '第四阶段：综合考核', stageColor: '#722ed1', submittedFlag: false, expectedReportFlag: true, holidayFlag: false },
    { date: '2026-04-26', stageName: '第四阶段：综合考核', stageColor: '#722ed1', submittedFlag: false, expectedReportFlag: false, holidayFlag: true },
    { date: '2026-04-27', stageName: '第四阶段：综合考核', stageColor: '#722ed1', submittedFlag: false, expectedReportFlag: true, holidayFlag: false },
    { date: '2026-04-28', stageName: '第四阶段：综合考核', stageColor: '#722ed1', submittedFlag: false, expectedReportFlag: true, holidayFlag: false },
    { date: '2026-04-29', stageName: '第四阶段：综合考核', stageColor: '#722ed1', submittedFlag: false, expectedReportFlag: true, holidayFlag: false },
    { date: '2026-04-30', stageName: '第四阶段：综合考核', stageColor: '#722ed1', submittedFlag: false, expectedReportFlag: true, holidayFlag: false }
  ]
};

const stageInfoItems = [];

function getDifficultyTagType(difficulty: string): 'success' | 'warning' | 'error' | 'default' {
  if (difficulty === '简单') return 'success';
  if (difficulty === '中等') return 'warning';
  if (difficulty === '困难') return 'error';
  return 'default';
}
</script>

<template>
  <InfoPageLayout>
    <template #contentBox>
      <div class="workbench-layout">
        <!-- 顶部区域 -->
        <div class="workbench-top">
          <!-- 用户信息卡片 -->
          <div class="user-welcome-card">
            <div class="user-welcome-card__avatar">
              <span>张</span>
            </div>
            <div class="user-welcome-card__info">
              <div class="user-welcome-card__name">张三</div>
              <div class="user-welcome-card__greeting">欢迎回来，继续加油！</div>
            </div>
          </div>

          <!-- 阶段进度条 - 节点加轴形式 -->
          <div class="stages-progress-card">
            <div class="stages-progress-card__left">
              <div class="stages-progress-card__title-row">
                <span class="stages-progress-card__title">{{ mockPathInfo.name }}</span>
                <span class="stages-progress-card__dates">
                  <span class="date-chip">{{ mockPathInfo.startedAt }}</span>
                  <span class="date-separator">—</span>
                  <span class="date-chip">{{ mockPathInfo.expectedEndAt }}</span>
                </span>
              </div>
              <div class="stages-timeline">
                <!-- 开始节点 -->
                <NTooltip trigger="hover">
                  <template #trigger>
                    <span :style="getBoundaryDotStyle(true, mockStages.some(s => s.status !== 'pending'))"></span>
                  </template>
                  开始
                </NTooltip>
                <span :style="getBoundaryLineStyle(mockStages.some(s => s.status !== 'pending'))"></span>

                <!-- 阶段节点 -->
                <template v-for="(stage, index) in mockStages" :key="stage.id">
                  <NTooltip trigger="hover">
                    <template #trigger>
                      <span :style="getStageDotStyle(stage)"></span>
                    </template>
                    <div class="stage-tooltip">
                      <div class="stage-tooltip__name">{{ stage.name }}</div>
                      <div class="stage-tooltip__status">
                        {{ stage.status === 'passed' ? '已完成' : stage.status === 'in_progress' ? '进行中' : '未开始' }}
                      </div>
                      <div v-if="stage.startedAt" class="stage-tooltip__date">开始于 {{ stage.startedAt }}</div>
                    </div>
                  </NTooltip>
                  <span v-if="index < mockStages.length - 1" :style="getStageLineStyle(mockStages[index + 1])"></span>
                </template>

                <!-- 结束节点 -->
                <span :style="getBoundaryLineStyle(mockStages.every(s => s.status === 'passed'))"></span>
                <NTooltip trigger="hover">
                  <template #trigger>
                    <span :style="getBoundaryDotStyle(false, mockStages.every(s => s.status === 'passed'))"></span>
                  </template>
                  结束
                </NTooltip>
              </div>
            </div>
            <div class="stages-progress-card__right">
              <span class="date-chip stages-progress-card__duration">{{ mockCurrentStage.duration }}</span>
              <NButton type="primary" size="small" @click="openAssessmentModal">申请考核</NButton>
            </div>
          </div>
        </div>

        <!-- 主体区域 -->
        <div class="workbench-body">
          <!-- 左侧主内容 -->
          <div class="workbench-main">
            <!-- 当前阶段信息 -->
            <div class="content-card">
              <div class="content-card__header">
                <div class="content-card__title">{{ mockCurrentStage.name }}</div>
                <div class="stage-header-tags">
                  <span class="date-chip">预计完成：5-7天</span>
                  <DictTag dict-code="assessment_path_stage_status" value="in_progress" />
                </div>
              </div>
              <div class="content-card__body">
                <div class="stage-description">
                  <div class="stage-description__item">
                    <div class="stage-description__label">阶段说明</div>
                    <div class="stage-description__text markdown-body" v-html="renderMarkdown(mockCurrentStage.description)"></div>
                  </div>
                  <div class="stage-description__item">
                    <div class="stage-description__label">考核说明</div>
                    <div class="stage-description__text markdown-body" v-html="renderMarkdown(mockCurrentStage.assessmentDescription)"></div>
                  </div>
                </div>

                <!-- 阶段资料 -->
                <div class="stage-materials">
                  <div class="stage-materials__label">阶段资料</div>
                  <div class="stage-materials__list">
                    <div v-for="task in mockLearningTasks" :key="task.title" class="stage-material-item">
                      <span class="stage-material-item__icon">
                        <svg v-if="task.fileType === 'video'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                      </span>
                      <span class="stage-material-item__title">{{ task.title }}</span>
                      <NTag size="tiny" :bordered="false" type="info">{{ task.type }}</NTag>
                      <NButton
                        v-if="isMultimedia(task.fileType)"
                        size="tiny"
                        type="primary"
                        @click="() => {}"
                      >
                        播放
                      </NButton>
                      <NButton
                        v-else
                        size="tiny"
                        type="default"
                        @click="() => {}"
                      >
                        下载
                      </NButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧边栏 -->
          <div class="workbench-sidebar">
            <!-- 日历 -->
            <div class="content-card content-card--calendar">
              <div class="content-card__header">
                <div class="content-card__title">日历</div>
              </div>
              <div class="content-card__body">
                <WorkbenchDailyCalendar :calendar="mockCalendar" />
              </div>
            </div>

            <!-- 日报列表 -->
            <div class="content-card">
              <div class="content-card__header">
                <div class="content-card__title">日报</div>
                <NButton v-if="hasTodayReport" size="tiny" type="primary" @click="openReportModal">修改日报</NButton>
                <NButton v-else size="tiny" type="primary" @click="openReportModal">新增日报</NButton>
              </div>
              <div class="content-card__body">
                <div class="report-list">
                  <div v-for="report in mockReports" :key="report.date" class="report-item" @click="openViewReportModal(report)">
                    <div class="report-item__header">
                      <span class="report-item__date">{{ report.date }}</span>
                      <DictTag dict-code="assessment_path_stage_status" value="passed" />
                    </div>
                    <div class="report-item__content">
                      <div class="report-item__line">
                        <span class="report-item__label">内容</span>
                        <span class="report-item__text">{{ report.content }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </InfoPageLayout>

  <!-- 修改日报弹窗 -->
  <NModal
    v-model:show="showReportModal"
    preset="card"
    :title="hasTodayReport ? '修改日报' : '新增日报'"
    :style="{ width: '80%' }"
  >
    <div class="report-modal-form">
      <div class="form-field form-field--large">
        <div class="form-field__label">内容</div>
        <MarkdownEditor
          v-model:value="reportForm.content"
          placeholder="填写今日学习和完成情况（支持Markdown语法）"
        />
      </div>
    </div>
    <template #action>
      <div class="em-dialog-actions">
        <NButton @click="closeReportModal">取消</NButton>
        <NButton type="primary" @click="handleSubmitReport">提交</NButton>
      </div>
    </template>
  </NModal>

  <!-- 查看日报弹窗 -->
  <NModal
    v-model:show="showViewReportModal"
    preset="card"
    :title="currentViewReport?.date + ' 日报'"
    :style="{ width: '80%' }"
    :mask-closable="true"
  >
    <div class="report-modal-form">
      <div class="form-field form-field--large">
        <MarkdownEditor
          v-model:value="currentViewReportContent"
          preview-only
        />
      </div>
    </div>
    <template #action>
      <div class="em-dialog-actions">
        <NButton @click="closeViewReportModal">关闭</NButton>
      </div>
    </template>
  </NModal>

  <!-- 申请考核弹窗 -->
  <NModal
    v-model:show="showAssessmentModal"
    preset="card"
    title="申请考核"
    :style="{ width: '400px' }"
  >
    <div class="form-field">
      <div class="form-field__label">申请理由</div>
      <NInput
        v-model:value="assessmentForm.reason"
        type="textarea"
        placeholder="填写申请理由"
        :autosize="{ minRows: 3, maxRows: 5 }"
      />
    </div>
    <template #action>
      <div class="em-dialog-actions">
        <NButton @click="closeAssessmentModal">取消</NButton>
        <NButton type="primary" @click="handleSubmitAssessment">提交申请</NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped lang="scss">
.workbench-layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  min-height: 0;
}

// 顶部区域
.workbench-top {
  display: flex;
  gap: 16px;
  align-items: stretch;
  flex-shrink: 0;
}

.user-welcome-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 20px;
  border-radius: 14px;
  background: rgb(var(--container-bg-color));
  box-shadow:
    inset 0 0 0 1px rgb(var(--border-color)),
    0 1px 2px rgb(31 35 41 / 4%);
}

.user-welcome-card__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgb(var(--em-primary-color-rgb) / 0.15);
  color: var(--em-primary-color);
  font-size: 18px;
  font-weight: 600;
}

.user-welcome-card__info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-welcome-card__name {
  color: var(--n-text-color-1);
  font-size: 16px;
  font-weight: 600;
}

.user-welcome-card__greeting {
  color: var(--n-text-color-3);
  font-size: 12px;
}

// 阶段进度条卡片 - 时间线样式
.stages-progress-card {
  flex: 1;
  display: flex;
  gap: 16px;
  padding: 14px 16px;
  border-radius: 14px;
  background: rgb(var(--container-bg-color));
  box-shadow:
    inset 0 0 0 1px rgb(var(--border-color)),
    0 1px 2px rgb(31 35 41 / 4%);
  overflow-x: auto;

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgb(var(--border-color));
    border-radius: 2px;
  }
}

.stages-progress-card__left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.stages-progress-card__right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.stages-progress-card__title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.stages-progress-card__title {
  color: var(--n-text-color-1);
  font-size: 14px;
  font-weight: 600;
}

.stages-progress-card__dates {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--n-text-color-3);
  font-size: 12px;
}

.date-chip {
  padding: 2px 8px;
  border-radius: 4px;
  background: rgb(var(--em-primary-color-rgb) / 10%);
  color: var(--em-primary-color);
  font-size: 11px;
  font-weight: 500;
}

.date-separator {
  color: var(--n-text-color-3);
}

.stages-progress-card__duration {
  color: var(--n-text-color-2);
  font-size: 12px;
  font-weight: 500;
}

.stages-timeline {
  display: inline-flex;
  align-items: center;
  gap: 0;
}

// 阶段提示框样式
.stage-tooltip {
  padding: 4px 0;
}

.stage-tooltip__name {
  color: var(--n-text-color-1);
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 2px;
}

.stage-tooltip__status {
  color: var(--n-text-color-2);
  font-size: 11px;
}

.stage-tooltip__date {
  color: var(--n-text-color-3);
  font-size: 10px;
  margin-top: 2px;
}

// 主体区域
.workbench-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 16px;
  flex: 1;
  min-height: 0;
  align-items: stretch;
}

.workbench-main {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;

  > .content-card {
    flex-shrink: 0;
  }

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgb(var(--border-color));
    border-radius: 3px;
  }
}

.workbench-sidebar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 300px;
  flex-shrink: 0;
  min-height: 0;
  height: 100%;
  overflow: hidden;

  > .content-card {
    &:first-child {
      flex-shrink: 0;
    }

    &:last-child {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
  }
}

// 内容卡片 - 统一样式
.content-card {
  flex-shrink: 0;
  border-radius: 14px;
  background: rgb(var(--container-bg-color));
  box-shadow:
    inset 0 0 0 1px rgb(var(--border-color)),
    0 1px 2px rgb(31 35 41 / 4%);
}

.content-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid rgb(var(--border-color) / 60%);
}

.content-card__title {
  color: var(--n-text-color-1);
  font-size: 14px;
  font-weight: 600;
}

.stage-header-tags {
  display: flex;
  align-items: center;
  gap: 8px;
}

.content-card__body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 12px 16px;
  box-sizing: border-box;
  overflow: hidden;
}

// 侧边栏卡片
.workbench-sidebar {
  > .content-card:last-child {
    .content-card__body {
      flex: 1;
      overflow: hidden;
    }

    .report-list {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
    }
  }
}

// 阶段说明
.stage-description {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.stage-description__item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  border-radius: 10px;
  background: rgb(var(--layout-bg-color));
  box-shadow: inset 0 0 0 1px rgb(var(--border-color) / 60%);
  min-height: 0;
  flex: 1;
}

.stage-description__label {
  color: var(--n-text-color-3);
  font-size: 11px;
  font-weight: 500;
  flex-shrink: 0;
}

.stage-description__text {
  color: var(--n-text-color-2);
  font-size: 13px;
  line-height: 1.5;
  max-height: 400px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgb(var(--border-color));
    border-radius: 2px;
  }

  :deep(h1) {
    font-size: 16px;
    font-weight: 600;
    color: var(--n-text-color-1);
    margin-bottom: 8px;
    border-bottom: 1px solid rgb(var(--border-color) / 40%);
    padding-bottom: 4px;
  }

  :deep(h2) {
    font-size: 14px;
    font-weight: 600;
    color: var(--n-text-color-1);
    margin-bottom: 6px;
    margin-top: 10px;
  }

  :deep(h3) {
    font-size: 13px;
    font-weight: 600;
    color: var(--n-text-color-1);
    margin-bottom: 4px;
    margin-top: 8px;
  }

  :deep(h4) {
    font-size: 12px;
    font-weight: 600;
    color: var(--n-text-color-1);
    margin-bottom: 3px;
    margin-top: 6px;
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

  :deep(strong) {
    font-weight: 600;
    color: var(--n-text-color-1);
  }

  :deep(em) {
    font-style: italic;
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
    padding: 8px;
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

  :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 8px;
    font-size: 11px;
  }

  :deep(th),
  :deep(td) {
    padding: 4px 8px;
    border: 1px solid rgb(var(--border-color) / 60%);
    text-align: left;
  }

  :deep(th) {
    background: rgb(var(--layout-bg-color));
    font-weight: 600;
  }

  :deep(hr) {
    border: none;
    border-top: 1px solid rgb(var(--border-color) / 60%);
    margin: 8px 0;
  }
}

// 阶段资料
.stage-materials {
  margin-top: 12px;
  padding: 12px;
  border-radius: 10px;
  background: rgb(var(--layout-bg-color));
  box-shadow: inset 0 0 0 1px rgb(var(--border-color) / 60%);
}

.stage-materials__label {
  color: var(--n-text-color-3);
  font-size: 11px;
  font-weight: 500;
  margin-bottom: 8px;
}

.stage-materials__list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stage-material-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgb(var(--container-bg-color));
  text-decoration: none;
  transition: background 0.15s ease;

  &:hover {
    background: rgb(var(--border-color) / 50%);
  }
}

.stage-material-item__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--em-primary-color);
}

.stage-material-item__title {
  flex: 1;
  color: var(--n-text-color-1);
  font-size: 13px;
}

// 任务列表
.task-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgb(var(--layout-bg-color));

  &--material {
    border-left: 3px solid rgb(var(--em-primary-color-rgb) / 0.6);
  }

  &--assessment {
    border-left: 3px solid rgb(208 48 80 / 0.5);
  }
}

.task-item__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.task-item__header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.task-item__title {
  color: var(--n-text-color-1);
  font-size: 13px;
  font-weight: 500;
}

.task-item__meta {
  display: flex;
  gap: 12px;
  color: var(--n-text-color-3);
  font-size: 11px;
}

// 阶段说明 - 双栏布局
.description-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  flex: 1;
  min-height: 0;

  > .content-card {
    display: flex;
    flex-direction: column;
    min-height: 0;

    .content-card__body {
      // flex: 1;
      height: 100px;
      min-height: 0;
      overflow-y: auto;
    }
  }
}

.description-text {
  color: var(--n-text-color-2);
  font-size: 13px;
  line-height: 1.6;
}

// 日报列表
.report-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgb(var(--border-color));
    border-radius: 2px;
  }
}

.report-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgb(var(--layout-bg-color));
  flex-shrink: 0;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: rgb(var(--border-color) / 50%);
  }
}

.report-item__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.report-item__date {
  color: var(--n-text-color-1);
  font-size: 12px;
  font-weight: 600;
}

.report-item__status {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgb(82 196 26 / 15%);
  color: rgb(82 196 26);
  font-size: 11px;
  font-weight: 500;
}

.report-item__content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.report-item__line {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  gap: 6px;
  align-items: start;
}

.report-item__label {
  color: var(--n-text-color-3);
  font-size: 10px;
}

.report-item__text {
  color: var(--n-text-color-2);
  font-size: 11px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

// 响应式
@media (width <= 1180px) {
  .workbench-body {
    grid-template-columns: 1fr;
  }

  .workbench-sidebar {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;

    > .content-card {
      flex: 1 1 280px;
    }
  }
}

@media (width <= 960px) {
  .workbench-top {
    flex-direction: column;
  }

  .user-welcome-card {
    padding: 12px 16px;
  }

  .stages-progress-card {
    gap: 10px;
  }

  .stage-progress-item {
    flex: 0 0 140px;
  }
}
</style>

<!-- 日报弹窗样式 -->
<style lang="scss">
.report-modal-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &--large {
    height: 800px;

    :deep(.markdown-editor) {
      height: 100%;
    }
  }
}

.form-field__label {
  color: var(--n-text-color-2);
  font-size: 13px;
  font-weight: 500;
}

.report-modal-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 70vh;
  overflow-y: auto;
}
</style>
