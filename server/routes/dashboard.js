const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/kpis', dashboardController.getDashboardKPIs);
router.get('/financial', dashboardController.getFinancialDashboard);

module.exports = router;