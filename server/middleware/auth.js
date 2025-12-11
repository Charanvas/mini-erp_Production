const jwt = require('jsonwebtoken');
const config = require('../config/config');
const db = require('../config/database');

// Verify JWT Token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Fetch user from database
    const result = await db.query(
      'SELECT id, username, email, full_name, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        success: false,
        message: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({
        success: false,
        message: 'Token expired'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error.message
    });
  }
};

// Check User Role
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this resource`
      });
    }

    next();
  };
};

// Audit Log Middleware
const auditLog = async (req, res, next) => {
  const originalSend = res.send;

  res.send = function(data) {
    res.send = originalSend;

    // Log after response
    if (req.user && req.method !== 'GET') {
      const logData = {
        userId: req.user.id,
        action: `${req.method} ${req.originalUrl}`,
        tableName: req.body?.tableName || null,
        recordId: req.body?.id || req.params?.id || null,
        newValues: req.body || null,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      };

      db.query(
        `INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          logData.userId,
          logData.action,
          logData.tableName,
          logData.recordId,
          JSON.stringify(logData.newValues),
          logData.ipAddress,
          logData.userAgent
        ]
      ).catch(err => console.error('Audit log error:', err));
    }

    return res.send(data);
  };

  next();
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  auditLog
};