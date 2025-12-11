const db = require('../config/database');
const riskCalculator = require('../services/riskCalculator');
const cashFlowForecaster = require('../services/cashFlowForecaster');

// Calculate Project Risk
exports.calculateProjectRisk = async (req, res) => {
  try {
    const { id } = req.params;

    // Get project data
    const projectResult = await db.query(
      `SELECT 
        p.*,
        COALESCE(
          (SELECT COUNT(*) FROM invoices WHERE project_id = p.id AND status = 'Overdue'),
          0
        ) as overdue_invoices
      FROM projects p
      WHERE p.id = $1`,
      [id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const project = projectResult.rows[0];

    // Calculate risk using service
    const risk = riskCalculator.calculateRisk(project);

    // Save risk log
    await db.query(
      `INSERT INTO risk_logs (project_id, risk_score, risk_level, factors)
       VALUES ($1, $2, $3, $4)`,
      [id, risk.risk_score, risk.risk_level, JSON.stringify(risk.factors)]
    );

    res.json({
      success: true,
      data: {
        project_id: parseInt(id),
        project_name: project.project_name,
        risk_score: risk.risk_score,
        risk_level: risk.risk_level,
        factors: risk.factors,
        recommendations: risk.recommendations
      }
    });
  } catch (error) {
    console.error('Calculate project risk error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate project risk',
      error: error.message
    });
  }
};

// Get All Project Risks
exports.getAllProjectRisks = async (req, res) => {
  try {
    const projectsResult = await db.query(`
      SELECT 
        p.*,
        COALESCE(
          (SELECT COUNT(*) FROM invoices WHERE project_id = p.id AND status = 'Overdue'),
          0
        ) as overdue_invoices
      FROM projects p
      WHERE p.status IN ('Planning', 'Active', 'On Hold')
      ORDER BY p.created_at DESC
    `);

    const risks = projectsResult.rows.map(project => {
      const risk = riskCalculator.calculateRisk(project);
      return {
        project_id: project.id,
        project_code: project.project_code,
        project_name: project.project_name,
        risk_score: risk.risk_score,
        risk_level: risk.risk_level,
        factors: risk.factors
      };
    });

    res.json({
      success: true,
      data: {
        risks
      }
    });
  } catch (error) {
    console.error('Get all project risks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project risks',
      error: error.message
    });
  }
};

// Cash Flow Forecast
exports.getCashFlowForecast = async (req, res) => {
  try {
    const { months = 6 } = req.query;

    // Get historical cash flow data
    const historicalResult = await db.query(`
      SELECT * FROM cash_flow_summary
      ORDER BY month DESC
      LIMIT $1
    `, [months]);

    if (historicalResult.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          historical: [],
          forecast: [],
          message: 'Insufficient data for forecasting'
        }
      });
    }

    // Calculate forecast
    const forecast = cashFlowForecaster.forecast(historicalResult.rows, 3);

    res.json({
      success: true,
      data: {
        historical: historicalResult.rows.reverse(),
        forecast: forecast,
        summary: {
          average_inflow: forecast.average_inflow,
          average_outflow: forecast.average_outflow,
          average_net_flow: forecast.average_net_flow
        }
      }
    });
  } catch (error) {
    console.error('Cash flow forecast error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate cash flow forecast',
      error: error.message
    });
  }
};

// Project Progress Insights
exports.getProjectProgressInsights = async (req, res) => {
  try {
    const { id } = req.params;

    const projectResult = await db.query(
      'SELECT * FROM projects WHERE id = $1',
      [id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const project = projectResult.rows[0];

    // Calculate deviations
    const progressDeviation = parseFloat(project.actual_progress) - parseFloat(project.planned_progress);
    const budgetUsagePercent = (parseFloat(project.spent) / parseFloat(project.budget)) * 100;
    const budgetDeviation = budgetUsagePercent - parseFloat(project.actual_progress);

    // Determine health status
    let healthStatus = 'Good';
    let healthScore = 100;

    if (progressDeviation < -10) {
      healthStatus = 'Critical';
      healthScore -= 40;
    } else if (progressDeviation < -5) {
      healthStatus = 'Poor';
      healthScore -= 20;
    }

    if (budgetDeviation > 15) {
      healthStatus = 'Critical';
      healthScore -= 40;
    } else if (budgetDeviation > 10) {
      healthStatus = 'Poor';
      healthScore -= 20;
    }

    // Get progress history
    const historyResult = await db.query(
      `SELECT * FROM project_progress 
       WHERE project_id = $1 
       ORDER BY progress_date DESC 
       LIMIT 10`,
      [id]
    );

    res.json({
      success: true,
      data: {
        project_id: project.id,
        project_name: project.project_name,
        health_status: healthStatus,
        health_score: Math.max(0, healthScore),
        metrics: {
          budget: {
            total: parseFloat(project.budget),
            spent: parseFloat(project.spent),
            remaining: parseFloat(project.budget) - parseFloat(project.spent),
            usage_percent: budgetUsagePercent.toFixed(2)
          },
          progress: {
            planned: parseFloat(project.planned_progress),
            actual: parseFloat(project.actual_progress),
            deviation: progressDeviation.toFixed(2)
          },
          timeline: {
            start_date: project.start_date,
            end_date: project.end_date,
            status: project.status
          }
        },
        insights: {
          is_on_schedule: progressDeviation >= -5,
          is_within_budget: budgetDeviation <= 10,
          budget_deviation: budgetDeviation.toFixed(2)
        },
        progress_history: historyResult.rows
      }
    });
  } catch (error) {
    console.error('Get project progress insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project insights',
      error: error.message
    });
  }
};

// Dashboard AI Insights
exports.getDashboardInsights = async (req, res) => {
  try {
    // High-risk projects
    const highRiskProjects = await db.query(`
      SELECT 
        p.*,
        COALESCE(
          (SELECT COUNT(*) FROM invoices WHERE project_id = p.id AND status = 'Overdue'),
          0
        ) as overdue_invoices
      FROM projects p
      WHERE p.status IN ('Active', 'On Hold')
        AND (
          p.spent > p.budget * 0.9
          OR p.actual_progress < p.planned_progress - 10
        )
      ORDER BY (p.spent / NULLIF(p.budget, 0)) DESC
      LIMIT 5
    `);

    // Overdue payments summary
    const overduePayments = await db.query(`
      SELECT 
        COUNT(*) as count,
        SUM(balance) as total_amount,
        invoice_type
      FROM invoices
      WHERE status = 'Overdue'
      GROUP BY invoice_type
    `);

    // Budget alerts
    const budgetAlerts = await db.query(`
      SELECT 
        project_code,
        project_name,
        budget,
        spent,
        (spent / budget * 100) as usage_percent
      FROM projects
      WHERE status IN ('Active', 'Planning')
        AND spent > budget * 0.85
      ORDER BY (spent / budget) DESC
    `);

    // Revenue trends
    const revenueTrend = await db.query(`
      SELECT 
        TO_CHAR(invoice_date, 'YYYY-MM') as month,
        SUM(total_amount) as revenue
      FROM invoices
      WHERE invoice_type = 'Receivable'
        AND status = 'Paid'
        AND invoice_date >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY TO_CHAR(invoice_date, 'YYYY-MM')
      ORDER BY month DESC
    `);

    res.json({
      success: true,
      data: {
        high_risk_projects: highRiskProjects.rows,
        overdue_payments: overduePayments.rows,
        budget_alerts: budgetAlerts.rows,
        revenue_trend: revenueTrend.rows,
        summary: {
          critical_projects: highRiskProjects.rows.length,
          total_overdue: overduePayments.rows.reduce((sum, p) => sum + parseFloat(p.total_amount || 0), 0),
          projects_over_budget: budgetAlerts.rows.length
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard insights',
      error: error.message
    });
  }
};