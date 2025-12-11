const express = require('express');
const router = express.Router();
const insightController = require('../controllers/insightController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/dashboard', insightController.getDashboardInsights);
router.get('/risks', insightController.getAllProjectRisks);
router.get('/risks/:id', insightController.calculateProjectRisk);
router.get('/cash-flow-forecast', insightController.getCashFlowForecast);
router.get('/project-progress/:id', insightController.getProjectProgressInsights);

module.exports = router;