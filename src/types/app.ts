export interface ApiResponse<T> {
  code: string;
  msg: string;
  data: T;
}

export interface RequestResult<T> {
  data: T;
  error: Error | null;
  code: string;
  msg: string;
}

export interface LoginToken {
  token: string;
  refreshToken: string;
}

export interface UserInfo {
  userId: string;
  username: string;
  roles: string[];
  buttons: string[];
}

export interface RouteMeta {
  title?: string;
  i18nKey?: string;
  icon?: string;
  order?: number;
  hideInMenu?: boolean;
  keepAlive?: boolean;
  constant?: boolean;
  activeMenu?: string;
}

export interface RouteItem {
  id: string;
  name: string;
  path: string;
  component?: string | null;
  meta?: RouteMeta;
  children?: RouteItem[];
}

export interface UserRouteResponse {
  home: string;
  routes: RouteItem[];
}

export interface PageResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
}

export interface DictVo {
  id?: string;
  name?: string;
  code?: string;
  description?: string;
  status?: number;
  statusLabel?: string;
  dictTemplateStr?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DictBo {
  pageNum?: number;
  pageSize?: number;
  id?: string;
  name?: string;
  code?: string;
  description?: string;
  status?: number;
  dictTemplateStr?: string;
}

export interface DictValuesVo {
  id?: string;
  dictId?: string;
    dictCode?: string;
    label?: string;
    value?: string;
    customColor?: string;
    className?: string;
    sort?: number;
  status: string;
  statusLabel?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MenuVo {
  id?: string;
  parentId?: string;
  key?: string;
  label?: string;
  i18nKey?: string;
  routeKey?: string;
  routePath?: string;
  component?: string;
  icon?: string;
  menuType?: 'DIRECTORY' | 'MENU';
  sort?: number;
  status?: number;
  hideInMenu?: boolean;
  keepAlive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  children?: MenuVo[];
}

export interface MenuBo {
  pageNum?: number;
  pageSize?: number;
  id?: string;
  parentId?: string;
  key?: string;
  label?: string;
  i18nKey?: string;
  routeKey?: string;
  routePath?: string;
  component?: string;
  icon?: string;
  menuType?: 'DIRECTORY' | 'MENU';
  sort?: number;
  status?: number;
  hideInMenu?: boolean;
  keepAlive?: boolean;
}

export interface UserVo {
  id?: string;
  employeeNo?: string;
  name?: string;
  username?: string;
  gender?: string;
  birthday?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  departmentId?: string;
  departmentName?: string;
  userType?: string;
  userTypeLabel?: string;
  positionName?: string;
  positionNameLabel?: string;
  leaderFlag?: boolean;
  entryDate?: string;
  jobStatus?: string;
  workStatus?: string;
  accountStatus?: string;
  currentAssessmentStage?: string;
  assessmentStatus?: string;
  assessmentTemplateName?: string;
  account?: string;
  password?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserBo {
  pageNum?: number;
  pageSize?: number;
  id?: string;
  employeeNo?: string;
  name?: string;
  username?: string;
  gender?: string;
  birthday?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  departmentId?: string;
  userType?: string;
  positionName?: string;
  leaderFlag?: boolean;
  entryDate?: string;
  entryDateStart?: string;
  entryDateEnd?: string;
  jobStatus?: string;
  workStatus?: string;
  accountStatus?: string;
  account?: string;
  password?: string;
}

export interface UserOptionVo {
  id?: string;
  employeeNo?: string;
  name?: string;
  account?: string;
  departmentId?: string;
}

export interface DepartmentVo {
  id?: string;
  parentId?: string;
  name?: string;
  leaderEmployeeId?: string;
  leaderName?: string;
  sort?: number;
  status?: string;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
  children?: DepartmentVo[];
}

export interface DepartmentBo {
  id?: string;
  parentId?: string;
  name?: string;
  leaderEmployeeId?: string;
  sort?: number;
  status?: string;
  remark?: string;
}

export interface AssessmentStageMaterialVo {
  id?: string;
  stageId?: string;
  title?: string;
  materialType?: string;
  materialUrl?: string;
  sort?: number;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssessmentStageMaterialBo {
  id?: string;
  stageId?: string;
  title?: string;
  materialType?: string;
  materialUrl?: string;
  sort?: number;
  remark?: string;
}

export interface AssessmentStageRuleVo {
  id?: string;
  stageId?: string;
  questionType?: string;
  difficulty?: string;
  knowledgePoints?: string;
  questionCount?: number;
  score?: number | string;
  sort?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssessmentStageRuleBo {
  id?: string;
  stageId?: string;
  questionType?: string;
  difficulty?: string;
  knowledgePoints?: string;
  questionCount?: number;
  score?: number | string;
  sort?: number;
}

export interface AssessmentStageVo {
  id?: string;
  code?: string;
  name?: string;
  description?: string;
  sort?: number;
  status?: string;
  minStudyDays?: number;
  maxStudyDays?: number;
  passScore?: number | string;
  passRemark?: string;
  createdAt?: string;
  updatedAt?: string;
  materials?: AssessmentStageMaterialVo[];
  rules?: AssessmentStageRuleVo[];
}

export interface AssessmentStageBo {
  pageNum?: number;
  pageSize?: number;
  id?: string;
  code?: string;
  name?: string;
  description?: string;
  sort?: number;
  status?: string;
  minStudyDays?: number;
  maxStudyDays?: number;
  passScore?: number | string;
  passRemark?: string;
  materials?: AssessmentStageMaterialBo[];
  rules?: AssessmentStageRuleBo[];
}

export interface AssessmentPathTemplateStageVo {
  id?: string;
  templateId?: string;
  stageId?: string;
  sort?: number;
  stageCode?: string;
  stageNameSnapshot?: string;
  stageDescription?: string;
  minStudyDays?: number;
  maxStudyDays?: number;
  passScore?: number | string;
  passRemark?: string;
  materials?: AssessmentStageMaterialVo[];
  rules?: AssessmentStageRuleVo[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AssessmentPathTemplateStageBo {
  id?: string;
  stageId?: string;
  sort?: number;
}

export interface AssessmentPathTemplateVo {
  id?: string;
  name?: string;
  description?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  stages?: AssessmentPathTemplateStageVo[];
}

export interface AssessmentPathTemplateBo {
  pageNum?: number;
  pageSize?: number;
  id?: string;
  name?: string;
  description?: string;
  status?: string;
  stages?: AssessmentPathTemplateStageBo[];
}

export interface AssessmentQuestionOptionVo {
  id?: string;
  questionId?: string;
  optionKey?: string;
  optionLabel?: string;
  sort?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssessmentQuestionOptionBo {
  id?: string;
  questionId?: string;
  optionKey?: string;
  optionLabel?: string;
  sort?: number;
}

export interface AssessmentQuestionVo {
  id?: string;
  stageId?: string;
  stageName?: string;
  questionType?: string;
  stem?: string;
  knowledgePoint?: string;
  difficulty?: string;
  score?: number | string;
  answerContent?: string;
  analysis?: string;
  sort?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  options?: AssessmentQuestionOptionVo[];
}

export interface AssessmentQuestionBo {
  pageNum?: number;
  pageSize?: number;
  id?: string;
  stageId?: string;
  questionType?: string;
  stem?: string;
  knowledgePoint?: string;
  difficulty?: string;
  score?: number | string;
  answerContent?: string;
  analysis?: string;
  sort?: number;
  status?: string;
  options?: AssessmentQuestionOptionBo[];
}

export interface AssessmentInternPathStageVo {
  id?: string;
  pathId?: string;
  userId?: string;
  stageId?: string;
  stageName?: string;
  sort?: number;
  sourceType?: string;
  status?: string;
  minStudyDays?: number;
  maxStudyDays?: number;
  latestPaperId?: string;
  latestPaperStatus?: string;
  latestPaperQuestionTotal?: number;
  latestPaperCorrectTotal?: number;
  latestPaperScore?: number | string;
  latestPaperPassFlag?: boolean;
  latestPaperFinalComment?: string;
  latestPaperCreatedAt?: string;
  latestPaperReviewedAt?: string;
  startedAt?: string;
  endedAt?: string;
  studyDurationDays?: number;
  assessAt?: string;
  overtimeFlag?: boolean;
  delayedAssessFlag?: boolean;
  rating?: string;
  autoStartNext?: boolean;
  earliestAssessAt?: string;
  latestAssessAt?: string;
  timingStatus?: string;
  timingDescription?: string;
  reviewedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssessmentInternPathStageBo {
  id?: string;
  stageId?: string;
  stageName?: string;
  sort?: number;
  sourceType?: string;
  status?: string;
  minStudyDays?: number;
  maxStudyDays?: number;
}

export interface AssessmentStageActionBo {
  pathStageId?: string;
  rating?: string;
  autoStartNext?: boolean;
}

export interface AssessmentStageDailyReportVo {
  id?: string;
  pathId?: string;
  pathStageId?: string;
  userId?: string;
  reportDate?: string;
  content?: string;
  problem?: string;
  plan?: string;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssessmentStageDailyReportBo {
  id?: string;
  pathId?: string;
  pathStageId?: string;
  userId?: string;
  reportDate?: string;
  content?: string;
  problem?: string;
  plan?: string;
  remark?: string;
}

export interface AssessmentInternPathVo {
  id?: string;
  userId?: string;
  userName?: string;
  employeeNo?: string;
  templateId?: string;
  templateName?: string;
  trainingStartDate?: string;
  trainingEndDate?: string;
  currentStageId?: string;
  currentStageName?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  stages?: AssessmentInternPathStageVo[];
}

export interface AssessmentInternPathBo {
  pageNum?: number;
  pageSize?: number;
  id?: string;
  userId?: string;
  templateId?: string;
  trainingStartDate?: string;
  trainingEndDate?: string;
  status?: string;
  stages?: AssessmentInternPathStageBo[];
}

export interface AssessmentScheduleCalcVo {
  recommendedTrainingStartDate?: string;
  autoTrainingEndDate?: string;
  adjustedTrainingEndDate?: string;
  startDateAdjusted?: boolean;
  endDateAdjusted?: boolean;
  stages?: AssessmentScheduleCalcStageVo[];
}

export interface AssessmentScheduleCalcStageVo {
  stageId?: string;
  stageName?: string;
  sort?: number;
  minStudyDays?: number;
  maxStudyDays?: number;
  plannedStartDate?: string;
  earliestAssessDate?: string;
  latestAssessDate?: string;
}

export interface AssessmentPaperItemVo {
  id?: string;
  paperId?: string;
  questionId?: string;
  questionType?: string;
  stem?: string;
  knowledgePoint?: string;
  difficulty?: string;
  score?: number | string;
  optionSnapshot?: string;
  answerSnapshot?: string;
  analysis?: string;
  studentAnswer?: string;
  autoCorrect?: boolean;
  manualResult?: string;
  finalResult?: string;
  reviewComment?: string;
  sort?: number;
  createdAt?: string;
  updatedAt?: string;
  options?: AssessmentQuestionOptionVo[];
}

export interface AssessmentPaperVo {
  id?: string;
  userId?: string;
  userName?: string;
  pathId?: string;
  pathStageId?: string;
  stageId?: string;
  stageName?: string;
  status?: string;
  questionTotal?: number;
  correctTotal?: number;
  score?: number | string;
  passFlag?: boolean;
  finalComment?: string;
  reviewedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  items?: AssessmentPaperItemVo[];
}

export interface AssessmentPaperQueryBo {
  pageNum?: number;
  pageSize?: number;
  userId?: string;
  pathId?: string;
  pathStageId?: string;
  stageId?: string;
  status?: string;
}

export interface AssessmentPaperCreateBo {
  userId?: string;
  pathId?: string;
  pathStageId?: string;
}

export interface AssessmentPaperRegenerateBo {
  paperId?: string;
}

export interface AssessmentPaperItemReviewBo {
  id?: string;
  studentAnswer?: string;
  manualResult?: string;
  reviewComment?: string;
}

export interface AssessmentPaperReviewBo {
  paperId?: string;
  submitFlag?: boolean;
  passFlag?: boolean;
  finalComment?: string;
  items?: AssessmentPaperItemReviewBo[];
}

export interface AssessmentReportStageStatVo {
  stageId?: string;
  stageName?: string;
  totalCount?: number;
  passedCount?: number;
  passRate?: string;
}

export interface AssessmentReportQuestionStatVo {
  questionId?: string;
  stem?: string;
  questionType?: string;
  totalCount?: number;
  correctCount?: number;
  correctRate?: string;
}

export interface AssessmentReportOverviewVo {
  internCount?: number;
  stageCount?: number;
  paperCount?: number;
  pendingReviewCount?: number;
  stageStats?: AssessmentReportStageStatVo[];
  questionStats?: AssessmentReportQuestionStatVo[];
}

export interface AppMenuOption {
  key: string;
  label: string;
  path: string;
  icon?: string;
  activeMenu?: string;
  hideInMenu?: boolean;
  keepAlive?: boolean;
  children?: AppMenuOption[];
}

export interface TabItem {
  key: string;
  path: string;
  label: string;
  closable: boolean;
}
