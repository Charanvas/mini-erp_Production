const db = require('../config/database');

// Get All Projects
exports.getProjects = async (req, res) => {
  try {
    const { status, project_manager_id, customer_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        p.*,
        c.customer_name,
        u.full_name as project_manager_name
      FROM projects p
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN users u ON p.project_manager_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND p.status = $${paramCount}`;
      params.push(status);
    }

    if (project_manager_id) {
      paramCount++;
      query += ` AND p.project_manager_id = $${paramCount}`;
      params.push(project_manager_id);
    }

    if (customer_id) {
      paramCount++;
      query += ` AND p.customer_id = $${paramCount}`;
      params.push(customer_id);
    }

    const countQuery = query.replace(
      'SELECT p.*, c.customer_name, u.full_name as project_manager_name',
      'SELECT COUNT(*)'
    );
    const countResult = await db.query(countQuery, params);

    query += ` ORDER BY p.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: {
        projects: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(countResult.rows[0].count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects',
      error: error.message
    });
  }
};

// Get Project by ID
exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT 
        p.*,
        c.customer_name,
        c.contact_person as customer_contact,
        c.email as customer_email,
        u.full_name as project_manager_name,
        u.email as project_manager_email
      FROM projects p
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN users u ON p.project_manager_id = u.id
      WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Get project progress history
    const progressResult = await db.query(
      `SELECT 
        pp.*,
        u.full_name as recorded_by
      FROM project_progress pp
      LEFT JOIN users u ON pp.created_by = u.id
      WHERE pp.project_id = $1
      ORDER BY pp.progress_date DESC`,
      [id]
    );

    // Get project invoices
    const invoicesResult = await db.query(
      'SELECT * FROM invoices WHERE project_id = $1 ORDER BY invoice_date DESC',
      [id]
    );

    const project = result.rows[0];
    project.progress_history = progressResult.rows;
    project.invoices = invoicesResult.rows;

    res.json({
      success: true,
      data: {
        project
      }
    });
  } catch (error) {
    console.error('Get project by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project',
      error: error.message
    });
  }
};

// Create Project
exports.createProject = async (req, res) => {
  try {
    const {
      project_code,
      project_name,
      customer_id,
      project_manager_id,
      budget,
      start_date,
      end_date,
      location,
      description
    } = req.body;

    // Validation
    if (!project_code || !project_name || !budget) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const result = await db.query(
      `INSERT INTO projects (
        project_code, project_name, customer_id, project_manager_id,
        budget, start_date, end_date, location, description
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        project_code, project_name, customer_id, project_manager_id,
        budget, start_date, end_date, location, description
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: {
        project: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create project',
      error: error.message
    });
  }
};

// Update Project
exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      project_name,
      customer_id,
      project_manager_id,
      budget,
      status,
      start_date,
      end_date,
      planned_progress,
      actual_progress,
      location,
      description
    } = req.body;

    const updates = [];
    const params = [];
    let paramCount = 0;

    if (project_name) {
      paramCount++;
      updates.push(`project_name = $${paramCount}`);
      params.push(project_name);
    }

    if (customer_id !== undefined) {
      paramCount++;
      updates.push(`customer_id = $${paramCount}`);
      params.push(customer_id);
    }

    if (project_manager_id !== undefined) {
      paramCount++;
      updates.push(`project_manager_id = $${paramCount}`);
      params.push(project_manager_id);
    }

    if (budget) {
      paramCount++;
      updates.push(`budget = $${paramCount}`);
      params.push(budget);
    }

    if (status) {
      paramCount++;
      updates.push(`status = $${paramCount}`);
      params.push(status);
    }

    if (start_date) {
      paramCount++;
      updates.push(`start_date = $${paramCount}`);
      params.push(start_date);
    }

    if (end_date) {
      paramCount++;
      updates.push(`end_date = $${paramCount}`);
      params.push(end_date);
    }

    if (planned_progress !== undefined) {
      paramCount++;
      updates.push(`planned_progress = $${paramCount}`);
      params.push(planned_progress);
    }

    if (actual_progress !== undefined) {
      paramCount++;
      updates.push(`actual_progress = $${paramCount}`);
      params.push(actual_progress);
    }

    if (location) {
      paramCount++;
      updates.push(`location = $${paramCount}`);
      params.push(location);
    }

    if (description !== undefined) {
      paramCount++;
      updates.push(`description = $${paramCount}`);
      params.push(description);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    paramCount++;
    params.push(id);

    const query = `
      UPDATE projects 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: {
        project: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update project',
      error: error.message
    });
  }
};

// Record Project Progress
exports.recordProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { progress_date, planned_progress, actual_progress, budget_spent, notes } = req.body;

    // Validation
    if (!progress_date || planned_progress === undefined || actual_progress === undefined || !budget_spent) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Insert progress record
    const progressResult = await db.query(
      `INSERT INTO project_progress (
        project_id, progress_date, planned_progress, actual_progress,
        budget_spent, notes, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [id, progress_date, planned_progress, actual_progress, budget_spent, notes, req.user.id]
    );

    // Update project
    await db.query(
      `UPDATE projects 
       SET planned_progress = $1, actual_progress = $2, spent = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [planned_progress, actual_progress, budget_spent, id]
    );

    res.status(201).json({
      success: true,
      message: 'Project progress recorded successfully',
      data: {
        progress: progressResult.rows[0]
      }
    });
  } catch (error) {
    console.error('Record progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record progress',
      error: error.message
    });
  }
};

// Delete Project
exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'UPDATE projects SET status = $1 WHERE id = $2 RETURNING *',
      ['Cancelled', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      message: 'Project cancelled successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete project',
      error: error.message
    });
  }
};