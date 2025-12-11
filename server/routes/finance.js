const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

// Chart of Accounts
router.get('/accounts', financeController.getAccounts);
router.post('/accounts', authorizeRoles('Admin', 'Finance Manager'), financeController.createAccount);
router.put('/accounts/:id', authorizeRoles('Admin', 'Finance Manager'), financeController.updateAccount);

// Journal Entries
router.get('/journal-entries', financeController.getJournalEntries);
router.post('/journal-entries', authorizeRoles('Admin', 'Finance Manager'), financeController.createJournalEntry);
router.post('/journal-entries/:id/post', authorizeRoles('Admin', 'Finance Manager'), financeController.postJournalEntry);

// Financial Statements
router.get('/balance-sheet', financeController.getBalanceSheet);
router.get('/profit-loss', financeController.getProfitLoss);
router.get('/cash-flow', financeController.getCashFlow);

// Vendors & Customers
router.get('/vendors', financeController.getVendors);
router.post('/vendors', authorizeRoles('Admin', 'Finance Manager'), financeController.createVendor);
router.get('/customers', financeController.getCustomers);
router.post('/customers', authorizeRoles('Admin', 'Finance Manager'), financeController.createCustomer);

module.exports = router;