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

export interface PageQuery {
  pageNum?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: 'ascend' | 'descend' | 'asc' | 'desc';
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

export interface DictBo extends PageQuery {
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

export interface MenuBo extends PageQuery {
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

export type StorageConfigType = 'MINIO' | 'ALIYUN' | 'HUAWEI' | 'TENCENT' | 'LOCAL';

export interface StorageConfigVo {
  id?: string;
  name?: string;
  storageGroup?: string;
  storageType?: StorageConfigType | string;
  storageTypeLabel?: string;
  endpoint?: string;
  bucketName?: string;
  accessKey?: string;
  secretKey?: string;
  region?: string;
  basePath?: string;
  publicUrl?: string;
  pathPrefix?: string;
  status?: number;
  statusLabel?: string;
  defaultFlag?: boolean;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StorageConfigBo extends PageQuery {
  id?: string;
  name?: string;
  storageGroup?: string;
  storageType?: StorageConfigType | string;
  endpoint?: string;
  bucketName?: string;
  accessKey?: string;
  secretKey?: string;
  region?: string;
  basePath?: string;
  publicUrl?: string;
  pathPrefix?: string;
  status?: number;
  defaultFlag?: boolean;
  remark?: string;
}

export interface FileRecordVo {
  id?: string;
  storageConfigId?: string;
  storageGroup?: string;
  storageType?: StorageConfigType | string;
  storageTypeLabel?: string;
  storageName?: string;
  fileName?: string;
  storedName?: string;
  filePath?: string;
  fileUrl?: string;
  fileSize?: number;
  contentType?: string;
  uploaderId?: string;
  uploaderName?: string;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FileRecordBo extends PageQuery {
  id?: string;
  storageConfigId?: string;
  storageGroup?: string;
  storageType?: StorageConfigType | string;
  storageName?: string;
  fileName?: string;
  uploaderName?: string;
  remark?: string;
}

export interface RoleVo {
  id?: string;
  name?: string;
  code?: string;
  description?: string;
  status?: number;
  statusLabel?: string;
  menuCheckStrictly?: boolean;
  createdAt?: string;
  updatedAt?: string;
  menuIds?: string[];
  menus?: MenuVo[];
}

export interface RoleBo extends PageQuery {
  id?: string;
  name?: string;
  code?: string;
  description?: string;
  status?: number;
  menuCheckStrictly?: boolean;
  menuIds?: string[];
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
  jobStatusLabel?: string;
  workStatus?: string;
  workStatusLabel?: string;
  accountStatus?: string;
  accountStatusLabel?: string;
  roleIds?: string[];
  roleNames?: string[];
  currentAssessmentStage?: string;
  assessmentStatus?: string;
  assessmentTemplateName?: string;
  account?: string;
  password?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserBo extends PageQuery {
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
  roleIds?: string[];
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
  defaultRoleId?: string;
  defaultRoleName?: string;
  sort?: number;
  status?: string;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
  children?: DepartmentVo[];
}

export interface DepartmentBo {
  sortField?: string;
  sortOrder?: 'ascend' | 'descend' | 'asc' | 'desc';
  id?: string;
  parentId?: string;
  name?: string;
  leaderEmployeeId?: string;
  defaultRoleId?: string;
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
  remark?: string;
  stageColor?: string;
  achievementRequired?: boolean;
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

export interface AssessmentStageBo extends PageQuery {
  id?: string;
  code?: string;
  name?: string;
  description?: string;
  remark?: string;
  stageColor?: string;
  achievementRequired?: boolean;
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
  finalTemplateId?: string;
  finalTemplateName?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  stages?: AssessmentPathTemplateStageVo[];
}

export interface AssessmentPathTemplateBo extends PageQuery {
  id?: string;
  name?: string;
  description?: string;
  finalTemplateId?: string;
  finalTemplateName?: string;
  status?: string;
  stages?: AssessmentPathTemplateStageBo[];
}

export interface AssessmentFinalTemplateItemVo {
  id?: string;
  templateId?: string;
  dimensionId?: string;
  name?: string;
  description?: string;
  score?: number | string;
  sort?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssessmentFinalTemplateItemBo {
  id?: string;
  name?: string;
  description?: string;
  score?: number | string;
  sort?: number;
}

export interface AssessmentFinalTemplateDimensionVo {
  id?: string;
  templateId?: string;
  name?: string;
  code?: string;
  description?: string;
  score?: number | string;
  sort?: number;
  createdAt?: string;
  updatedAt?: string;
  items?: AssessmentFinalTemplateItemVo[];
}

export interface AssessmentFinalTemplateDimensionBo {
  id?: string;
  name?: string;
  code?: string;
  description?: string;
  score?: number | string;
  sort?: number;
  items?: AssessmentFinalTemplateItemBo[];
}

export interface AssessmentFinalTemplateVo {
  id?: string;
  name?: string;
  description?: string;
  totalScore?: number | string;
  status?: string;
  statusLabel?: string;
  createdAt?: string;
  updatedAt?: string;
  dimensions?: AssessmentFinalTemplateDimensionVo[];
}

export interface AssessmentFinalTemplateBo extends PageQuery {
  id?: string;
  name?: string;
  description?: string;
  totalScore?: number | string;
  status?: string;
  dimensions?: AssessmentFinalTemplateDimensionBo[];
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
  used?: boolean;
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

export interface AssessmentQuestionBo extends PageQuery {
  id?: string;
  ids?: string[];
  used?: boolean;
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

export interface AssessmentTaskVo {
  id?: string;
  bizType?: string;
  taskType?: string;
  taskName?: string;
  status?: string;
  userId?: string;
  userName?: string;
  fileName?: string;
  fileSize?: number;
  resultFileName?: string;
  resultFileSize?: number;
  progress?: number;
  totalCount?: number;
  successCount?: number;
  failCount?: number;
  message?: string;
  errorMessage?: string;
  runVersion?: number;
  startedAt?: string;
  finishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssessmentInternPathStageVo {
  id?: string;
  pathId?: string;
  userId?: string;
  stageId?: string;
  stageName?: string;
  stageColor?: string;
  sort?: number;
  sourceType?: string;
  status?: string;
  minStudyDays?: number;
  maxStudyDays?: number;
  achievementRequired?: boolean;
  achievementSubmittedFlag?: boolean;
  achievementSubmittedAt?: string;
  achievementCount?: number;
  achievementUploadedFlag?: boolean;
  latestPaperId?: string;
  assessRequestedFlag?: boolean;
  assessRequestReason?: string;
  assessRequestedAt?: string;
  latestPaperStatus?: string;
  violationFlag?: boolean;
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
  timingStatusLabel?: string;
  timingDescription?: string;
  reviewedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  achievements?: AssessmentStageAchievementVo[];
}

export interface AssessmentStageAchievementVo {
  id?: string;
  pathId?: string;
  pathStageId?: string;
  userId?: string;
  stageId?: string;
  stageName?: string;
  fileId?: string;
  fileName?: string;
  fileUrl?: string;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssessmentStageAchievementBo {
  id?: string;
  pathId?: string;
  pathStageId?: string;
  userId?: string;
  stageId?: string;
  stageName?: string;
  fileId?: string;
  fileName?: string;
  fileUrl?: string;
  remark?: string;
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
  pathId?: string;
  pathStageId?: string;
  rating?: string;
  passFlag?: boolean;
  finalComment?: string;
  assessRequestReason?: string;
  autoStartNext?: boolean;
  finalItems?: AssessmentFinalReviewItemBo[];
}

export interface AssessmentFinalReviewItemBo {
  dimensionId?: string;
  itemId?: string;
  score?: number | string | null;
  comment?: string;
}

export interface AssessmentFinalReviewItemVo {
  id?: string;
  pathId?: string;
  userId?: string;
  templateId?: string;
  templateName?: string;
  dimensionId?: string;
  dimensionName?: string;
  dimensionCode?: string;
  itemId?: string;
  itemName?: string;
  itemDescription?: string;
  maxScore?: number | string;
  score?: number | string;
  comment?: string;
  sort?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssessmentFinalReviewDimensionVo {
  dimensionId?: string;
  dimensionName?: string;
  dimensionCode?: string;
  maxScore?: number | string;
  score?: number | string;
  items?: AssessmentFinalReviewItemVo[];
}

export interface AssessmentFinalReviewRecordVo {
  id?: string;
  linkId?: string;
  pathId?: string;
  userId?: string;
  reviewerUserId?: string;
  reviewerName?: string;
  reviewerEmployeeNo?: string;
  templateId?: string;
  templateName?: string;
  totalScore?: number | string;
  comment?: string;
  submittedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  dimensions?: AssessmentFinalReviewDimensionVo[];
}

export interface AssessmentFinalReviewLinkCreateBo {
  pathId?: string;
}

export interface AssessmentFinalReviewLinkVo {
  id?: string;
  pathId?: string;
  token?: string;
  linkPath?: string;
  status?: string;
  expireAt?: string;
}

export interface AssessmentFinalReviewPublicDetailVo {
  token?: string;
  status?: string;
  expireAt?: string;
  expired?: boolean;
  path?: AssessmentInternPathVo;
  user?: UserVo;
  finalTemplate?: AssessmentFinalTemplateVo;
  paperRecords?: AssessmentPaperVo[];
  dailyCalendar?: AssessmentPathDailyCalendarVo;
  violationRecords?: AssessmentViolationRecordVo[];
  exitRecords?: AssessmentExitRecordVo[];
}

export interface AssessmentFinalReviewPublicSubmitBo {
  token?: string;
  reviewerUserId?: string;
  comment?: string;
  finalItems?: AssessmentFinalReviewItemBo[];
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

export interface AssessmentPathDailyCalendarDayVo {
  date?: string;
  pathStageId?: string;
  stageId?: string;
  stageName?: string;
  stageColor?: string;
  stageStatus?: string;
  stageStartedFlag?: boolean;
  assessDate?: string;
  passFlag?: boolean;
  rating?: string;
  holidayFlag?: boolean;
  expectedReportFlag?: boolean;
  submittedFlag?: boolean;
  overtimeStageFlag?: boolean;
  reportStatus?: 'submitted' | 'pending' | 'holiday' | 'upcoming' | 'none';
  reports?: AssessmentStageDailyReportVo[];
}

export interface AssessmentPathDailyCalendarVo {
  pathId?: string;
  userId?: string;
  userName?: string;
  startDate?: string;
  endDate?: string;
  days?: AssessmentPathDailyCalendarDayVo[];
}

export interface AssessmentDailyReportQueryBo {
  month?: string;
  date?: string;
  userId?: string;
  templateId?: string;
}

export interface AssessmentDailyReportCalendarDayVo {
  date?: string;
  dayOfMonth?: number;
  totalCount?: number;
  submittedCount?: number;
  pendingCount?: number;
}

export interface AssessmentDailyReportCalendarVo {
  month?: string;
  startDate?: string;
  endDate?: string;
  totalActiveCount?: number;
  totalSubmittedCount?: number;
  totalPendingCount?: number;
  days?: AssessmentDailyReportCalendarDayVo[];
}

export interface AssessmentDailyReportDetailItemVo {
  pathId?: string;
  userId?: string;
  userName?: string;
  employeeNo?: string;
  templateName?: string;
  pathStatus?: string;
  pathStageId?: string;
  stageName?: string;
  submitted?: boolean;
  reportId?: string;
  reportDate?: string;
  content?: string;
  problem?: string;
  plan?: string;
  remark?: string;
  updatedAt?: string;
}

export interface AssessmentDailyReportDateDetailVo {
  date?: string;
  totalCount?: number;
  submittedCount?: number;
  pendingCount?: number;
  records?: AssessmentDailyReportDetailItemVo[];
}

export interface AssessmentViolationRecordVo {
  id?: string;
  pathId?: string;
  pathStageId?: string;
  userId?: string;
  stageId?: string;
  stageName?: string;
  violationType?: string;
  description?: string;
  violationAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssessmentViolationRecordBo {
  id?: string;
  pathId?: string;
  pathStageId?: string;
  userId?: string;
  violationType?: string;
  description?: string;
  violationAt?: string;
}

export interface AssessmentExitRecordVo {
  id?: string;
  pathId?: string;
  pathStageId?: string;
  userId?: string;
  exitType?: string;
  reason?: string;
  violationCount?: number;
  exitAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssessmentExitRecordBo {
  pathId?: string;
  pathStageId?: string;
  userId?: string;
  exitType?: string;
  reason?: string;
}

export interface AssessmentInternPathVo {
  id?: string;
  userId?: string;
  userName?: string;
  employeeNo?: string;
  templateId?: string;
  templateName?: string;
  finalTemplateId?: string;
  finalTemplateName?: string;
  trainingStartDate?: string;
  trainingEndDate?: string;
  currentStageId?: string;
  currentStageName?: string;
  status?: string;
  statusLabel?: string;
  finalRating?: string;
  finalRatingLabel?: string;
  finalPassFlag?: boolean;
  finalScore?: number | string;
  finalComment?: string;
  finalReviewedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  stages?: AssessmentInternPathStageVo[];
  dailyCalendar?: AssessmentPathDailyCalendarVo;
  finalReviewDimensions?: AssessmentFinalReviewDimensionVo[];
  finalReviewRecords?: AssessmentFinalReviewRecordVo[];
}

export interface AssessmentInternPathBo extends PageQuery {
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

export interface AssessmentPaperQueryBo extends PageQuery {
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
  difficulty?: string;
  knowledgePoints?: string;
  questionIds?: string[];
}

export interface AssessmentPaperRegenerateBo {
  paperId?: string;
  difficulty?: string;
  knowledgePoints?: string;
  questionIds?: string[];
}

export interface AssessmentPaperItemRegenerateBo {
  paperId?: string;
  paperItemId?: string;
  difficulty?: string;
  knowledgePoints?: string;
  questionId?: string;
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
