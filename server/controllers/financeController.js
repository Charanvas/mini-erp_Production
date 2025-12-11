const db = require('../config/database');

// ============= CHART OF ACCOUNTS =============

// Get All Accounts
exports.getAccounts = async (req, res) => {
  try {
    const { account_type, is_active } = req.query;

    let query = 'SELECT * FROM accounts WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (account_type) {
      paramCount++;
      query += ` AND account_type = $${paramCount}`;
      params.push(account_type);
    }

    if (is_active !== undefined) {
      paramCount++;
      query += ` AND is_active = $${paramCount}`;
      params.push(is_active === 'true');
    }

    query += ' ORDER BY account_code';

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: {
        accounts: result.rows
      }
    });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch accounts',
      error: error.message
    });
  }
};

// Create Account
exports.createAccount = async (req, res) => {
  try {
    const {
      account_code,
      account_name,
      account_type,
      parent_account_id,
      currency,
      description
    } = req.body;

    // Validation
    if (!account_code || !account_name || !account_type) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const result = await db.query(
      `INSERT INTO accounts (account_code, account_name, account_type, parent_account_id, currency, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [account_code, account_name, account_type, parent_account_id, currency || 'USD', description]
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        account: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create account',
      error: error.message
    });
  }
};

// Update Account
exports.updateAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { account_name, account_type, parent_account_id, is_active, description } = req.body;

    const updates = [];
    const params = [];
    let paramCount = 0;

    if (account_name) {
      paramCount++;
      updates.push(`account_name = $${paramCount}`);
      params.push(account_name);
    }

    if (account_type) {
      paramCount++;
      updates.push(`account_type = $${paramCount}`);
      params.push(account_type);
    }

    if (parent_account_id !== undefined) {
      paramCount++;
      updates.push(`parent_account_id = $${paramCount}`);
      params.push(parent_account_id);
    }

    if (is_active !== undefined) {
      paramCount++;
      updates.push(`is_active = $${paramCount}`);
      params.push(is_active);
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
      UPDATE accounts 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    res.json({
      success: true,
      message: 'Account updated successfully',
      data: {
        account: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update account',
      error: error.message
    });
  }
};

// ============= JOURNAL ENTRIES =============

// Get All Journal Entries
exports.getJournalEntries = async (req, res) => {
  try {
    const { status, start_date, end_date, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        je.*,
        u.full_name as created_by_name
      FROM journal_entries je
      LEFT JOIN users u ON je.created_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND je.status = $${paramCount}`;
      params.push(status);
    }

    if (start_date) {
      paramCount++;
      query += ` AND je.entry_date >= $${paramCount}`;
      params.push(start_date);
    }

    if (end_date) {
      paramCount++;
      query += ` AND je.entry_date <= $${paramCount}`;
      params.push(end_date);
    }

    const countQuery = query.replace(
      'SELECT je.*, u.full_name as created_by_name',
      'SELECT COUNT(*)'
    );
    const countResult = await db.query(countQuery, params);

    query += ` ORDER BY je.entry_date DESC, je.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Fetch transactions for each journal entry
    for (let entry of result.rows) {
      const transactionsResult = await db.query(
        `SELECT t.*, a.account_code, a.account_name
         FROM transactions t
         JOIN accounts a ON t.account_id = a.id
         WHERE t.journal_entry_id = $1
         ORDER BY t.id`,
        [entry.id]
      );
      entry.transactions = transactionsResult.rows;
    }

    res.json({
      success: true,
      data: {
        journalEntries: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(countResult.rows[0].count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get journal entries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch journal entries',
      error: error.message
    });
  }
};

// Create Journal Entry
exports.createJournalEntry = async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');

    const {
      entry_number,
      entry_date,
      description,
      reference,
      transactions
    } = req.body;

    // Validation
    if (!entry_number || !entry_date || !transactions || transactions.length < 2) {
      throw new Error('Please provide all required fields and at least 2 transactions');
    }

    // Calculate totals
    let total_debit = 0;
    let total_credit = 0;

    transactions.forEach(t => {
      total_debit += parseFloat(t.debit || 0);
      total_credit += parseFloat(t.credit || 0);
    });

    // Check if debits equal credits
    if (Math.abs(total_debit - total_credit) > 0.01) {
      throw new Error('Debits must equal credits');
    }

    // Create journal entry
    const journalResult = await client.query(
      `INSERT INTO journal_entries (entry_number, entry_date, description, reference, total_debit, total_credit, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [entry_number, entry_date, description, reference, total_debit, total_credit, req.user.id]
    );

    const journalEntry = journalResult.rows[0];

    // Create transactions
    const transactionPromises = transactions.map(t =>
      client.query(
        `INSERT INTO transactions (journal_entry_id, account_id, debit, credit, description)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [journalEntry.id, t.account_id, t.debit || 0, t.credit || 0, t.description]
      )
    );

    const transactionResults = await Promise.all(transactionPromises);

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Journal entry created successfully',
      data: {
        journalEntry: {
          ...journalEntry,
          transactions: transactionResults.map(r => r.rows[0])
        }
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create journal entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create journal entry',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// Post Journal Entry (Update account balances)
exports.postJournalEntry = async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;

    // Get journal entry with transactions
    const journalResult = await client.query(
      'SELECT * FROM journal_entries WHERE id = $1',
      [id]
    );

    if (journalResult.rows.length === 0) {
      throw new Error('Journal entry not found');
    }

    const journalEntry = journalResult.rows[0];

    if (journalEntry.status === 'Posted') {
      throw new Error('Journal entry already posted');
    }

    // Get transactions
    const transactionsResult = await client.query(
      `SELECT t.*, a.account_type 
       FROM transactions t
       JOIN accounts a ON t.account_id = a.id
       WHERE t.journal_entry_id = $1`,
      [id]
    );

    // Update account balances
    for (let transaction of transactionsResult.rows) {
      const { account_id, debit, credit, account_type } = transaction;
      
      let balanceChange = 0;
      
      // Determine balance change based on account type
      if (['Asset', 'Expense'].includes(account_type)) {
        balanceChange = debit - credit;
      } else {
        balanceChange = credit - debit;
      }

      await client.query(
        'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [balanceChange, account_id]
      );
    }

    // Update journal entry status
    await client.query(
      'UPDATE journal_entries SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['Posted', id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Journal entry posted successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Post journal entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to post journal entry',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// ============= FINANCIAL STATEMENTS =============

// Get Balance Sheet
exports.getBalanceSheet = async (req, res) => {
  try {
    const { as_of_date } = req.query;

    const result = await db.query(`
      SELECT * FROM balance_sheet
      ORDER BY account_type, account_code
    `);

    // Group by account type
    const balanceSheet = {
      assets: result.rows.filter(a => a.account_type === 'Asset'),
      liabilities: result.rows.filter(a => a.account_type === 'Liability'),
      equity: result.rows.filter(a => a.account_type === 'Equity')
    };

    // Calculate totals
    balanceSheet.totalAssets = balanceSheet.assets.reduce((sum, a) => sum + parseFloat(a.balance), 0);
    balanceSheet.totalLiabilities = balanceSheet.liabilities.reduce((sum, a) => sum + parseFloat(a.balance), 0);
    balanceSheet.totalEquity = balanceSheet.equity.reduce((sum, a) => sum + parseFloat(a.balance), 0);

    res.json({
      success: true,
      data: {
        balanceSheet,
        asOfDate: as_of_date || new Date().toISOString().split('T')[0]
      }
    });
  } catch (error) {
    console.error('Get balance sheet error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch balance sheet',
      error: error.message
    });
  }
};

// Get Profit & Loss Statement
exports.getProfitLoss = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const result = await db.query(`
      SELECT * FROM profit_loss
      ORDER BY account_type, account_code
    `);

    // Group by account type
    const profitLoss = {
      revenue: result.rows.filter(a => a.account_type === 'Revenue'),
      expenses: result.rows.filter(a => a.account_type === 'Expense')
    };

    // Calculate totals
    profitLoss.totalRevenue = profitLoss.revenue.reduce((sum, a) => sum + parseFloat(a.balance), 0);
    profitLoss.totalExpenses = profitLoss.expenses.reduce((sum, a) => sum + parseFloat(a.balance), 0);
    profitLoss.netIncome = profitLoss.totalRevenue - profitLoss.totalExpenses;

    res.json({
      success: true,
      data: {
        profitLoss,
        period: {
          startDate: start_date || '2024-01-01',
          endDate: end_date || new Date().toISOString().split('T')[0]
        }
      }
    });
  } catch (error) {
    console.error('Get profit & loss error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profit & loss statement',
      error: error.message
    });
  }
};

// Get Cash Flow Statement
exports.getCashFlow = async (req, res) => {
  try {
    const { months = 6 } = req.query;

    const result = await db.query(
      `SELECT * FROM cash_flow_summary
       ORDER BY month DESC
       LIMIT $1`,
      [months]
    );

    res.json({
      success: true,
      data: {
        cashFlow: result.rows.reverse()
      }
    });
  } catch (error) {
    console.error('Get cash flow error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cash flow statement',
      error: error.message
    });
  }
};

// ============= VENDORS & CUSTOMERS =============

// Get All Vendors
exports.getVendors = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM vendors WHERE is_active = true ORDER BY vendor_name'
    );

    res.json({
      success: true,
      data: {
        vendors: result.rows
      }
    });
  } catch (error) {
    console.error('Get vendors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vendors',
      error: error.message
    });
  }
};

// Create Vendor
exports.createVendor = async (req, res) => {
  try {
    const {
      vendor_code,
      vendor_name,
      contact_person,
      email,
      phone,
      address,
      city,
      country,
      tax_id,
      payment_terms,
      currency
    } = req.body;

    const result = await db.query(
      `INSERT INTO vendors (vendor_code, vendor_name, contact_person, email, phone, address, city, country, tax_id, payment_terms, currency)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [vendor_code, vendor_name, contact_person, email, phone, address, city, country, tax_id, payment_terms, currency || 'USD']
    );

    res.status(201).json({
      success: true,
      message: 'Vendor created successfully',
      data: {
        vendor: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Create vendor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create vendor',
      error: error.message
    });
  }
};

// Get All Customers
exports.getCustomers = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM customers WHERE is_active = true ORDER BY customer_name'
    );

    res.json({
      success: true,
      data: {
        customers: result.rows
      }
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers',
      error: error.message
    });
  }
};

// Create Customer
exports.createCustomer = async (req, res) => {
  try {
    const {
      customer_code,
      customer_name,
      contact_person,
      email,
      phone,
      address,
      city,
      country,
      tax_id,
      credit_limit,
      payment_terms,
      currency
    } = req.body;

    const result = await db.query(
      `INSERT INTO customers (customer_code, customer_name, contact_person, email, phone, address, city, country, tax_id, credit_limit, payment_terms, currency)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [customer_code, customer_name, contact_person, email, phone, address, city, country, tax_id, credit_limit, payment_terms, currency || 'USD']
    );

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: {
        customer: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create customer',
      error: error.message
    });
  }
};