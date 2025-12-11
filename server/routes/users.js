const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Admin only routes
router.get('/', authorizeRoles('Admin'), userController.getAllUsers);
router.post('/', authorizeRoles('Admin'), userController.createUser);
router.get('/audit-logs', authorizeRoles('Admin'), userController.getAuditLogs);
router.get('/:id', authorizeRoles('Admin'), userController.getUserById);
router.put('/:id', authorizeRoles('Admin'), userController.updateUser);
router.delete('/:id', authorizeRoles('Admin'), userController.deleteUser);

module.exports = router;