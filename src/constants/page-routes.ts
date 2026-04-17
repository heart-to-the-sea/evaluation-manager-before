export interface PageRouteTemplate {
  label: string;
  routeKey: string;
  routePath: string;
  component?: string;
}

export const PAGE_ROUTE_TEMPLATES: PageRouteTemplate[] = [
  { label: '首页', routeKey: 'home', routePath: '/home', component: 'layout.base$view.home' },
  {
    label: '字典管理',
    routeKey: 'system_manager_dict_manager',
    routePath: '/system-manager/dict-manager',
    component: 'view.system-manager.dict-manager'
  },
  {
    label: '菜单管理',
    routeKey: 'system_manager_menu',
    routePath: '/system-manager/menu',
    component: 'view.system-manager.menu.index'
  },
  {
    label: '菜单编辑',
    routeKey: 'system_manager_menu_edit_id',
    routePath: '/system-manager/menu/edit/:id',
    component: 'view.system-manager.menu.edit'
  },
  {
    label: '部门管理',
    routeKey: 'system_manager_department_index',
    routePath: '/system-manager/department',
    component: 'view.system-manager.department.index'
  },
  {
    label: '部门详情',
    routeKey: 'system_manager_department_info_id',
    routePath: '/system-manager/department/info/:id',
    component: 'view.system-manager.department.info'
  },
  {
    label: '人员管理',
    routeKey: 'user_manager_index',
    routePath: '/user-manager/index',
    component: 'view.user-manager.index'
  },
  {
    label: '人员详情',
    routeKey: 'user_manager_info_id',
    routePath: '/user-manager/info/:id',
    component: 'view.user-manager.info'
  },
  {
    label: '实习生考核',
    routeKey: 'intern_assessment',
    routePath: '/intern-assessment',
    component: 'layout.base'
  },
  {
    label: '考核管理',
    routeKey: 'intern_assessment_intern',
    routePath: '/intern-assessment/intern',
    component: 'view.intern-assessment.intern.index'
  },
  {
    label: '阶段管理',
    routeKey: 'intern_assessment_stage',
    routePath: '/intern-assessment/stage',
    component: 'view.intern-assessment.stage.index'
  },
  {
    label: '路径模板',
    routeKey: 'intern_assessment_template',
    routePath: '/intern-assessment/template',
    component: 'view.intern-assessment.template.index'
  },
  {
    label: '题库管理',
    routeKey: 'intern_assessment_question',
    routePath: '/intern-assessment/question',
    component: 'view.intern-assessment.question.index'
  },
  {
    label: '考核记录',
    routeKey: 'intern_assessment_paper',
    routePath: '/intern-assessment/paper',
    component: 'view.intern-assessment.paper.index'
  },
  {
    label: '考核批阅',
    routeKey: 'intern_assessment_paper_info_id',
    routePath: '/intern-assessment/paper/info/:id',
    component: 'view.intern-assessment.paper.info'
  },
  {
    label: '考核报表',
    routeKey: 'intern_assessment_report',
    routePath: '/intern-assessment/report',
    component: 'view.intern-assessment.report.index'
  },
  {
    label: '内嵌页面',
    routeKey: 'iframe_page_url',
    routePath: '/iframe-page/:url',
    component: 'layout.base$view.iframe-page'
  }
];
