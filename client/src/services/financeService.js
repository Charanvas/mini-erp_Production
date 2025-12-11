import api from './api';

const financeService = {
  // Accounts
  getAccounts: (params) => api.get('/finance/accounts', { params }),
  createAccount: (data) => api.post('/finance/accounts', data),
  updateAccount: (id, data) => api.put(`/finance/accounts/${id}`, data),

  // Journal Entries
  getJournalEntries: (params) => api.get('/finance/journal-entries', { params }),
  createJournalEntry: (data) => api.post('/finance/journal-entries', data),
  postJournalEntry: (id) => api.post(`/finance/journal-entries/${id}/post`),

  // Financial Statements
  getBalanceSheet: (params) => api.get('/finance/balance-sheet', { params }),
  getProfitLoss: (params) => api.get('/finance/profit-loss', { params }),
  getCashFlow: (params) => api.get('/finance/cash-flow', { params }),

  // Vendors & Customers
  getVendors: () => api.get('/finance/vendors'),
  createVendor: (data) => api.post('/finance/vendors', data),
  getCustomers: () => api.get('/finance/customers'),
  createCustomer: (data) => api.post('/finance/customers', data),
};

export default financeService;