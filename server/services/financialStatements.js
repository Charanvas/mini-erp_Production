/**
 * Financial Statements Service
 * Generate financial statements and reports
 */

const db = require('../config/database');

class FinancialStatements {
  async generateBalanceSheet(asOfDate = null) {
    const date = asOfDate || new Date().toISOString().split('T')[0];

    const result = await db.query(`
      SELECT 
        account_type,
        account_code,
        account_name,
        balance,
        currency
      FROM accounts
      WHERE is_active = true
        AND account_type IN ('Asset', 'Liability', 'Equity')
      ORDER BY account_type, account_code
    `);

    // Group accounts
    const assets = result.rows.filter(a => a.account_type === 'Asset');
    const liabilities = result.rows.filter(a => a.account_type === 'Liability');
    const equity = result.rows.filter(a => a.account_type === 'Equity');

    // Calculate totals
    const totalAssets = assets.reduce((sum, a) => sum + parseFloat(a.balance), 0);
    const totalLiabilities = liabilities.reduce((sum, a) => sum + parseFloat(a.balance), 0);
    const totalEquity = equity.reduce((sum, a) => sum + parseFloat(a.balance), 0);

    return {
      as_of_date: date,
      assets: {
        accounts: assets,
        total: totalAssets
      },
      liabilities: {
        accounts: liabilities,
        total: totalLiabilities
      },
      equity: {
        accounts: equity,
        total: totalEquity
      },
      balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
    };
  }

  async generateIncomeStatement(startDate, endDate) {
    const start = startDate || '2024-01-01';
    const end = endDate || new Date().toISOString().split('T')[0];

    const result = await db.query(`
      SELECT 
        a.account_type,
        a.account_code,
        a.account_name,
        COALESCE(SUM(
          CASE 
            WHEN a.account_type = 'Revenue' THEN t.credit - t.debit
            WHEN a.account_type = 'Expense' THEN t.debit - t.credit
            ELSE 0
          END
        ), 0) as amount
      FROM accounts a
      LEFT JOIN transactions t ON a.id = t.account_id
      LEFT JOIN journal_entries je ON t.journal_entry_id = je.id
      WHERE a.account_type IN ('Revenue', 'Expense')
        AND je.status = 'Posted'
        AND je.entry_date BETWEEN $1 AND $2
      GROUP BY a.account_type, a.account_code, a.account_name
      ORDER BY a.account_type DESC, a.account_code
    `, [start, end]);

    const revenue = result.rows.filter(a => a.account_type === 'Revenue');
    const expenses = result.rows.filter(a => a.account_type === 'Expense');

    const totalRevenue = revenue.reduce((sum, a) => sum + parseFloat(a.amount), 0);
    const totalExpenses = expenses.reduce((sum, a) => sum + parseFloat(a.amount), 0);
    const netIncome = totalRevenue - totalExpenses;

    return {
      period: {
        start_date: start,
        end_date: end
      },
      revenue: {
        accounts: revenue,
        total: totalRevenue
      },
      expenses: {
        accounts: expenses,
        total: totalExpenses
      },
      net_income: netIncome,
      profit_margin: totalRevenue > 0 ? ((netIncome / totalRevenue) * 100).toFixed(2) : 0
    };
  }

  async generateCashFlowStatement(startDate, endDate) {
    const start = startDate || '2024-01-01';
    const end = endDate || new Date().toISOString().split('T')[0];

    const result = await db.query(`
      SELECT * FROM cash_flow_summary
      WHERE month BETWEEN $1 AND $2
      ORDER BY month
    `, [start, end]);

    const totalInflow = result.rows.reduce((sum, r) => sum + parseFloat(r.cash_inflow || 0), 0);
    const totalOutflow = result.rows.reduce((sum, r) => sum + parseFloat(r.cash_outflow || 0), 0);
    const netCashFlow = totalInflow - totalOutflow;

    return {
      period: {
        start_date: start,
        end_date: end
      },
      monthly_data: result.rows,
      summary: {
        total_inflow: totalInflow,
        total_outflow: totalOutflow,
        net_cash_flow: netCashFlow
      }
    };
  }
}

module.exports = new FinancialStatements();