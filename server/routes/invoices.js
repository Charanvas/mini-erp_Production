const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

// Invoice routes
router.get('/', invoiceController.getInvoices);
router.get('/:id', invoiceController.getInvoiceById);
router.post('/', authorizeRoles('Admin', 'Finance Manager'), invoiceController.createInvoice);
router.put('/:id/status', authorizeRoles('Admin', 'Finance Manager'), invoiceController.updateInvoiceStatus);

// Payment routes
router.get('/payments/all', invoiceController.getPayments);
router.post('/payments', authorizeRoles('Admin', 'Finance Manager'), invoiceController.createPayment);

module.exports = router;