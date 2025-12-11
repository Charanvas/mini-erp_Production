import api from './api';

const projectService = {
  // Projects
  getProjects: (params) => api.get('/projects', { params }),
  getProjectById: (id) => api.get(`/projects/${id}`),
  createProject: (data) => api.post('/projects', data),
  updateProject: (id, data) => api.put(`/projects/${id}`, data),
  deleteProject: (id) => api.delete(`/projects/${id}`),
  recordProgress: (id, data) => api.post(`/projects/${id}/progress`, data),

  // Invoices
  getInvoices: (params) => api.get('/invoices', { params }),
  getInvoiceById: (id) => api.get(`/invoices/${id}`),
  createInvoice: (data) => api.post('/invoices', data),
  updateInvoiceStatus: (id, status) => api.put(`/invoices/${id}/status`, { status }),

  // Payments
  getPayments: (params) => api.get('/invoices/payments/all', { params }),
  createPayment: (data) => api.post('/invoices/payments', data),

  // Dashboard
  getDashboardKPIs: () => api.get('/dashboard/kpis'),
  getFinancialDashboard: () => api.get('/dashboard/financial'),

  // Insights
  getDashboardInsights: () => api.get('/insights/dashboard'),
  getProjectRisks: () => api.get('/insights/risks'),
  getProjectRisk: (id) => api.get(`/insights/risks/${id}`),
  getCashFlowForecast: (params) => api.get('/insights/cash-flow-forecast', { params }),
  getProjectProgressInsights: (id) => api.get(`/insights/project-progress/${id}`),

  // Users (Admin)
  getUsers: (params) => api.get('/users', { params }),
  getUserById: (id) => api.get(`/users/${id}`),
  createUser: (data) => api.post('/users', data),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getAuditLogs: (params) => api.get('/users/audit-logs', { params }),
};

export default projectService;