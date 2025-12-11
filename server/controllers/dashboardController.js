const db = require('../config/database');

// Get Dashboard KPIs
exports.getDashboardKPIs = async (req, res) => {
  try {
    // Total Projects
    const projectsResult = await db.query(`
      SELECT 
        COUNT(*) as total_projects,
        COUNT(*) FILTER (WHERE status = 'Active') as active_projects,
        COUNT(*) FILTER (WHERE status = 'Completed') as completed_projects
      FROM projects
    `);

    // Financial Summary
    const financialResult = await db.query(`
      SELECT 
        SUM(CASE WHEN invoice_type = 'Receivable' AND status = 'Paid' THEN total_amount ELSE 0 END) as total_revenue,
        SUM(CASE WHEN invoice_type = 'Receivable' AND status != 'Paid' THEN balance ELSE 0 END) as outstanding_receivables,
        SUM(CASE WHEN invoice_type = 'Payable' AND status != 'Paid' THEN balance ELSE 0 END) as outstanding_payables
      FROM invoices
    `);

    // Budget Overview
    const budgetResult = await db.query(`
      SELECT 
        SUM(budget) as total_budget,
        SUM(spent) as total_spent,
        SUM(budget - spent) as remaining_budget
      FROM projects
      WHERE status IN ('Planning', 'Active')
    `);

    // Cash Flow (Last 6 months)
    const cashFlowResult = await db.query(`
      SELECT * FROM cash_flow_summary
      LIMIT 6
    `);

    // Recent Invoices
    const recentInvoicesResult = await db.query(`
      SELECT 
        i.*,
        c.customer_name,
        p.project_name
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      LEFT JOIN projects p ON i.project_id = p.id
      ORDER BY i.created_at DESC
      LIMIT 5
    `);

    // Alerts
    const alertsResult = await db.query(`
      SELECT 
        'Overdue Invoice' as alert_type,
        invoice_number as reference,
        'Invoice ' || invoice_number || ' is overdue' as message,
        'high' as severity
      FROM invoices
      WHERE status = 'Overdue'
      
      UNION ALL
      
      SELECT 
        'Budget Overrun' as alert_type,
        project_code as reference,
        'Project ' || project_name || ' has exceeded budget' as message,
        'critical' as severity
      FROM projects
      WHERE spent > budget
      
      UNION ALL
      
      SELECT 
        'Project Delay' as alert_type,
        project_code as reference,
        'Project ' || project_name || ' is behind schedule' as message,
        'medium' as severity
      FROM projects
      WHERE actual_progress < planned_progress - 5
      
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        projects: projectsResult.rows[0],
        financial: financialResult.rows[0],
        budget: budgetResult.rows[0],
        cashFlow: cashFlowResult.rows,
        recentInvoices: recentInvoicesResult.rows,
        alerts: alertsResult.rows
      }
    });
  } catch (error) {
    console.error('Dashboard KPIs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
};

// Get Financial Dashboard
exports.getFinancialDashboard = async (req, res) => {
  try {
    // Revenue vs Expenses (Last 12 months)
    const revenueExpensesResult = await db.query(`
      SELECT 
        TO_CHAR(je.entry_date, 'YYYY-MM') as month,
        SUM(CASE WHEN a.account_type = 'Revenue' THEN t.credit ELSE 0 END) as revenue,
        SUM(CASE WHEN a.account_type = 'Expense' THEN t.debit ELSE 0 END) as expenses
      FROM journal_entries je
      JOIN transactions t ON je.id = t.journal_entry_id
      JOIN accounts a ON t.account_id = a.id
      WHERE je.status = 'Posted'
        AND je.entry_date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY TO_CHAR(je.entry_date, 'YYYY-MM')
      ORDER BY month DESC
    `);

    // Account Balances by Type
    const accountBalancesResult = await db.query(`
      SELECT 
        account_type,
        SUM(balance) as total_balance
      FROM accounts
      WHERE is_active = true
      GROUP BY account_type
    `);

    // Receivables Aging
    const receivablesAgingResult = await db.query(`
      SELECT 
        CASE 
          WHEN CURRENT_DATE - due_date <= 30 THEN '0-30 days'
          WHEN CURRENT_DATE - due_date <= 60 THEN '31-60 days'
          WHEN CURRENT_DATE - due_date <= 90 THEN '61-90 days'
          ELSE 'Over 90 days'
        END as aging_bucket,
        COUNT(*) as count,
        SUM(balance) as total_amount
      FROM invoices
      WHERE invoice_type = 'Receivable' AND status != 'Paid'
      GROUP BY aging_bucket
    `);

    // Payables Aging
    const payablesAgingResult = await db.query(`
      SELECT 
        CASE 
          WHEN CURRENT_DATE - due_date <= 30 THEN '0-30 days'
          WHEN CURRENT_DATE - due_date <= 60 THEN '31-60 days'
          WHEN CURRENT_DATE - due_date <= 90 THEN '61-90 days'
          ELSE 'Over 90 days'
        END as aging_bucket,
        COUNT(*) as count,
        SUM(balance) as total_amount
      FROM invoices
      WHERE invoice_type = 'Payable' AND status != 'Paid'
      GROUP BY aging_bucket
    `);

    // Top Customers by Revenue
    const topCustomersResult = await db.query(`
      SELECT 
        c.customer_name,
        SUM(i.total_amount) as total_revenue
      FROM customers c
      JOIN invoices i ON c.id = i.customer_id
      WHERE i.invoice_type = 'Receivable'
      GROUP BY c.id, c.customer_name
      ORDER BY total_revenue DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        revenueExpenses: revenueExpensesResult.rows,
        accountBalances: accountBalancesResult.rows,
        receivablesAging: receivablesAgingResult.rows,
        payablesAging: payablesAgingResult.rows,
        topCustomers: topCustomersResult.rows
      }
    });
  } catch (error) {
    console.error('Financial dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch financial dashboard data',
      error: error.message
    });
  }
};