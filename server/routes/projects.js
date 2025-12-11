const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProjectById);
router.post('/', authorizeRoles('Admin', 'Project Manager'), projectController.createProject);
router.put('/:id', authorizeRoles('Admin', 'Project Manager'), projectController.updateProject);
router.delete('/:id', authorizeRoles('Admin', 'Project Manager'), projectController.deleteProject);
router.post('/:id/progress', authorizeRoles('Admin', 'Project Manager'), projectController.recordProgress);

module.exports = router;