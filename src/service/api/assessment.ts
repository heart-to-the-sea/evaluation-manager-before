import type {
  AssessmentDailyReportCalendarVo,
  AssessmentDailyReportDateDetailVo,
  AssessmentDailyReportQueryBo,
  AssessmentInternPathBo,
  AssessmentPathDailyCalendarVo,
  AssessmentStageActionBo,
  AssessmentStageDailyReportBo,
  AssessmentStageDailyReportVo,
  AssessmentViolationRecordBo,
  AssessmentViolationRecordVo,
  AssessmentExitRecordBo,
  AssessmentExitRecordVo,
  AssessmentScheduleCalcVo,
  AssessmentInternPathVo,
  AssessmentPaperCreateBo,
  AssessmentPaperItemRegenerateBo,
  AssessmentPaperRegenerateBo,
  AssessmentPaperQueryBo,
  AssessmentPaperReviewBo,
  AssessmentPaperVo,
  AssessmentPathTemplateBo,
  AssessmentPathTemplateVo,
  AssessmentQuestionBo,
  AssessmentTaskVo,
  AssessmentQuestionVo,
  AssessmentReportOverviewVo,
  AssessmentStageBo,
  AssessmentStageVo,
  PageResult
} from '@/types/app';
import { request, requestBlob, requestUpload } from '../request';
import * as URL from './url';

export function fetchAssessmentStageList(params: AssessmentStageBo) {
  return request<PageResult<AssessmentStageVo>>({ url: URL.ASSESSMENT_STAGE_LIST, method: 'get', params });
}

export function fetchAssessmentStageById(id: string) {
  return request<AssessmentStageVo>({ url: URL.ASSESSMENT_STAGE_GET_BY_ID, method: 'get', params: { id } });
}

export function fetchAssessmentStageAdd(data: AssessmentStageBo) {
  return request<void>({ url: URL.ASSESSMENT_STAGE_ADD, method: 'post', data });
}

export function fetchAssessmentStageUpdate(data: AssessmentStageBo) {
  return request<void>({ url: URL.ASSESSMENT_STAGE_UPDATE, method: 'put', data });
}

export function fetchAssessmentStageDelete(id: string) {
  return request<void>({ url: URL.ASSESSMENT_STAGE_DELETE, method: 'delete', params: { id } });
}

export function fetchAssessmentTemplateList(params: AssessmentPathTemplateBo) {
  return request<PageResult<AssessmentPathTemplateVo>>({ url: URL.ASSESSMENT_TEMPLATE_LIST, method: 'get', params });
}

export function fetchAssessmentTemplateById(id: string) {
  return request<AssessmentPathTemplateVo>({ url: URL.ASSESSMENT_TEMPLATE_GET_BY_ID, method: 'get', params: { id } });
}

export function fetchAssessmentTemplateAdd(data: AssessmentPathTemplateBo) {
  return request<void>({ url: URL.ASSESSMENT_TEMPLATE_ADD, method: 'post', data });
}

export function fetchAssessmentTemplateUpdate(data: AssessmentPathTemplateBo) {
  return request<void>({ url: URL.ASSESSMENT_TEMPLATE_UPDATE, method: 'put', data });
}

export function fetchAssessmentTemplateDelete(id: string) {
  return request<void>({ url: URL.ASSESSMENT_TEMPLATE_DELETE, method: 'delete', params: { id } });
}

export function fetchAssessmentQuestionList(params: AssessmentQuestionBo) {
  return request<PageResult<AssessmentQuestionVo>>({ url: URL.ASSESSMENT_QUESTION_LIST, method: 'get', params });
}

export function fetchAssessmentQuestionById(id: string) {
  return request<AssessmentQuestionVo>({ url: URL.ASSESSMENT_QUESTION_GET_BY_ID, method: 'get', params: { id } });
}

export function fetchAssessmentQuestionAdd(data: AssessmentQuestionBo) {
  return request<void>({ url: URL.ASSESSMENT_QUESTION_ADD, method: 'post', data });
}

export function fetchAssessmentQuestionUpdate(data: AssessmentQuestionBo) {
  return request<void>({ url: URL.ASSESSMENT_QUESTION_UPDATE, method: 'put', data });
}

export function fetchAssessmentQuestionDelete(id: string) {
  return request<void>({ url: URL.ASSESSMENT_QUESTION_DELETE, method: 'delete', params: { id } });
}

export function fetchAssessmentQuestionBatchDelete(ids: string[]) {
  return request<void>({ url: URL.ASSESSMENT_QUESTION_BATCH_DELETE, method: 'post', data: { ids } });
}

export function fetchAssessmentQuestionImport(file: File, taskId?: string) {
  const formData = new FormData();
  formData.append('file', file);
  return requestUpload<AssessmentTaskVo>({
    url: URL.ASSESSMENT_QUESTION_IMPORT,
    method: 'post',
    params: taskId ? { taskId } : undefined,
    data: formData
  });
}

export function fetchAssessmentQuestionExport(data: AssessmentQuestionBo) {
  return request<AssessmentTaskVo>({ url: URL.ASSESSMENT_QUESTION_EXPORT, method: 'post', data });
}

export function fetchAssessmentQuestionTemplateDownload() {
  return requestBlob({ url: URL.ASSESSMENT_QUESTION_TEMPLATE_DOWNLOAD, method: 'get', fileName: '题库导入模板.xlsx' });
}

export function fetchAssessmentTaskList() {
  return request<AssessmentTaskVo[]>({ url: URL.ASSESSMENT_TASK_LIST, method: 'get' });
}

export function fetchAssessmentTaskDownload(id: string, fileName?: string) {
  return requestBlob({ url: URL.ASSESSMENT_TASK_DOWNLOAD, method: 'get', params: { id }, fileName });
}

export function fetchAssessmentPathList(params: AssessmentInternPathBo) {
  return request<PageResult<AssessmentInternPathVo>>({ url: URL.ASSESSMENT_PATH_LIST, method: 'get', params });
}

export function fetchAssessmentPathById(id: string) {
  return request<AssessmentInternPathVo>({ url: URL.ASSESSMENT_PATH_GET_BY_ID, method: 'get', params: { id } });
}

export function fetchAssessmentPathCalculate(data: AssessmentInternPathBo) {
  return request<AssessmentScheduleCalcVo>({ url: URL.ASSESSMENT_PATH_CALCULATE, method: 'post', data });
}

export function fetchAssessmentPathAdd(data: AssessmentInternPathBo) {
  return request<void>({ url: URL.ASSESSMENT_PATH_ADD, method: 'post', data });
}

export function fetchAssessmentPathUpdate(data: AssessmentInternPathBo) {
  return request<void>({ url: URL.ASSESSMENT_PATH_UPDATE, method: 'put', data });
}

export function fetchAssessmentPathDelete(id: string) {
  return request<void>({ url: URL.ASSESSMENT_PATH_DELETE, method: 'delete', params: { id } });
}

export function fetchAssessmentPathEnd(data: AssessmentStageActionBo) {
  return request<void>({ url: URL.ASSESSMENT_PATH_END, method: 'put', data });
}

export function fetchAssessmentPathStageStart(data: AssessmentStageActionBo) {
  return request<void>({ url: URL.ASSESSMENT_PATH_STAGE_START, method: 'put', data });
}

export function fetchAssessmentPathStageEnd(data: AssessmentStageActionBo) {
  return request<void>({ url: URL.ASSESSMENT_PATH_STAGE_END, method: 'put', data });
}

export function fetchAssessmentPathStageDailyList(pathStageId: string) {
  return request<AssessmentStageDailyReportVo[]>({ url: URL.ASSESSMENT_PATH_STAGE_DAILY_LIST, method: 'get', params: { pathStageId } });
}

export function fetchAssessmentPathStageDailySave(data: AssessmentStageDailyReportBo) {
  return request<void>({ url: URL.ASSESSMENT_PATH_STAGE_DAILY_SAVE, method: 'post', data });
}

export function fetchAssessmentPathStageDailyDelete(id: string) {
  return request<void>({ url: URL.ASSESSMENT_PATH_STAGE_DAILY_DELETE, method: 'delete', params: { id } });
}

export function fetchAssessmentPathDailyCalendar(pathId: string) {
  return request<AssessmentPathDailyCalendarVo>({ url: URL.ASSESSMENT_PATH_DAILY_CALENDAR, method: 'get', params: { pathId } });
}

export function fetchAssessmentDailyReportCalendar(params: AssessmentDailyReportQueryBo) {
  return request<AssessmentDailyReportCalendarVo>({ url: URL.ASSESSMENT_DAILY_REPORT_CALENDAR, method: 'get', params });
}

export function fetchAssessmentDailyReportDateDetail(params: AssessmentDailyReportQueryBo) {
  return request<AssessmentDailyReportDateDetailVo>({ url: URL.ASSESSMENT_DAILY_REPORT_DATE_DETAIL, method: 'get', params });
}

export function fetchAssessmentPathViolationList(params: { pathId?: string; pathStageId?: string }) {
  return request<AssessmentViolationRecordVo[]>({ url: URL.ASSESSMENT_PATH_VIOLATION_LIST, method: 'get', params });
}

export function fetchAssessmentPathViolationSave(data: AssessmentViolationRecordBo) {
  return request<AssessmentViolationRecordVo>({ url: URL.ASSESSMENT_PATH_VIOLATION_SAVE, method: 'post', data });
}

export function fetchAssessmentPathExitList(params: { pathId?: string; userId?: string }) {
  return request<AssessmentExitRecordVo[]>({ url: URL.ASSESSMENT_PATH_EXIT_LIST, method: 'get', params });
}

export function fetchAssessmentPathExitSave(data: AssessmentExitRecordBo) {
  return request<void>({ url: URL.ASSESSMENT_PATH_EXIT_SAVE, method: 'post', data });
}

export function fetchAssessmentPaperList(params: AssessmentPaperQueryBo) {
  return request<PageResult<AssessmentPaperVo>>({ url: URL.ASSESSMENT_PAPER_LIST, method: 'get', params });
}

export function fetchAssessmentPaperById(id: string) {
  return request<AssessmentPaperVo>({ url: URL.ASSESSMENT_PAPER_GET_BY_ID, method: 'get', params: { id } });
}

export function fetchAssessmentPaperCreate(data: AssessmentPaperCreateBo) {
  return request<string>({ url: URL.ASSESSMENT_PAPER_CREATE, method: 'post', data });
}

export function fetchAssessmentPaperRegenerate(data: AssessmentPaperRegenerateBo) {
  return request<string>({ url: URL.ASSESSMENT_PAPER_REGENERATE, method: 'post', data });
}

export function fetchAssessmentPaperItemRegenerate(data: AssessmentPaperItemRegenerateBo) {
  return request<void>({ url: URL.ASSESSMENT_PAPER_ITEM_REGENERATE, method: 'put', data });
}

export function fetchAssessmentPaperReview(data: AssessmentPaperReviewBo) {
  return request<void>({ url: URL.ASSESSMENT_PAPER_REVIEW, method: 'put', data });
}

export function fetchAssessmentReportOverview() {
  return request<AssessmentReportOverviewVo>({ url: URL.ASSESSMENT_REPORT_OVERVIEW, method: 'get' });
}
