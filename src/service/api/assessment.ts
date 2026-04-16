import type {
  AssessmentInternPathBo,
  AssessmentInternPathVo,
  AssessmentPaperCreateBo,
  AssessmentPaperQueryBo,
  AssessmentPaperReviewBo,
  AssessmentPaperVo,
  AssessmentPathTemplateBo,
  AssessmentPathTemplateVo,
  AssessmentQuestionBo,
  AssessmentQuestionVo,
  AssessmentReportOverviewVo,
  AssessmentStageBo,
  AssessmentStageVo,
  PageResult
} from '@/types/app';
import { request } from '../request';
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

export function fetchAssessmentPathList(params: AssessmentInternPathBo) {
  return request<PageResult<AssessmentInternPathVo>>({ url: URL.ASSESSMENT_PATH_LIST, method: 'get', params });
}

export function fetchAssessmentPathById(id: string) {
  return request<AssessmentInternPathVo>({ url: URL.ASSESSMENT_PATH_GET_BY_ID, method: 'get', params: { id } });
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

export function fetchAssessmentPaperList(params: AssessmentPaperQueryBo) {
  return request<PageResult<AssessmentPaperVo>>({ url: URL.ASSESSMENT_PAPER_LIST, method: 'get', params });
}

export function fetchAssessmentPaperById(id: string) {
  return request<AssessmentPaperVo>({ url: URL.ASSESSMENT_PAPER_GET_BY_ID, method: 'get', params: { id } });
}

export function fetchAssessmentPaperCreate(data: AssessmentPaperCreateBo) {
  return request<void>({ url: URL.ASSESSMENT_PAPER_CREATE, method: 'post', data });
}

export function fetchAssessmentPaperReview(data: AssessmentPaperReviewBo) {
  return request<void>({ url: URL.ASSESSMENT_PAPER_REVIEW, method: 'put', data });
}

export function fetchAssessmentReportOverview() {
  return request<AssessmentReportOverviewVo>({ url: URL.ASSESSMENT_REPORT_OVERVIEW, method: 'get' });
}
