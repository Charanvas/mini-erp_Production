const db = require('../config/database');

// Get All Invoices
exports.getInvoices = async (req, res) => {
  try {
    const { invoice_type, status, customer_id, project_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        i.*,
        c.customer_name,
        v.vendor_name,
        p.project_name,
        p.project_code
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      LEFT JOIN vendors v ON i.vendor_id = v.id
      LEFT JOIN projects p ON i.project_id = p.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (invoice_type) {
      paramCount++;
      query += ` AND i.invoice_type = $${paramCount}`;
      params.push(invoice_type);
    }

    if (status) {
      paramCount++;
      query += ` AND i.status = $${paramCount}`;
      params.push(status);
    }

    if (customer_id) {
      paramCount++;
      query += ` AND i.customer_id = $${paramCount}`;
      params.push(customer_id);
    }

    if (project_id) {
      paramCount++;
      query += ` AND i.project_id = $${paramCount}`;
      params.push(project_id);
    }

    const countQuery = query.replace(
      'SELECT i.*, c.customer_name, v.vendor_name, p.project_name, p.project_code',
      'SELECT COUNT(*)'
    );
    const countResult = await db.query(countQuery, params);

    query += ` ORDER BY i.invoice_date DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: {
        invoices: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(countResult.rows[0].count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoices',
      error: error.message
    });
  }
};

// Get Invoice by ID
exports.getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT 
        i.*,
        c.customer_name,
        c.email as customer_email,
        c.address as customer_address,
        v.vendor_name,
        v.email as vendor_email,
        v.address as vendor_address,
        p.project_name,
        p.project_code
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      LEFT JOIN vendors v ON i.vendor_id = v.id
      LEFT JOIN projects p ON i.project_id = p.id
      WHERE i.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Get payments for this invoice
    const paymentsResult = await db.query(
      'SELECT * FROM payments WHERE invoice_id = $1 ORDER BY payment_date DESC',
      [id]
    );

    const invoice = result.rows[0];
    invoice.payments = paymentsResult.rows;

    res.json({
      success: true,
      data: {
        invoice
      }
    });
  } catch (error) {
    console.error('Get invoice by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoice',
      error: error.message
    });
  }
};

// Create Invoice
exports.createInvoice = async (req, res) => {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const {
      invoice_number,
      invoice_type,
      customer_id,
      vendor_id,
      project_id,
      invoice_date,
      due_date,
      subtotal,
      tax_amount,
      discount_amount,
      currency,
      exchange_rate,
      notes,
      items
    } = req.body;

    // Validation
    if (!invoice_number || !invoice_type || !invoice_date || !due_date) {
      throw new Error('Please provide all required fields');
    }

    if (invoice_type === 'Receivable' && !customer_id) {
      throw new Error('Customer is required for receivable invoice');
    }

    if (invoice_type === 'Payable' && !vendor_id) {
      throw new Error('Vendor is required for payable invoice');
    }

    // Calculate total
    const total_amount = parseFloat(subtotal) + parseFloat(tax_amount || 0) - parseFloat(discount_amount || 0);

    // Create invoice
    const result = await client.query(
      `INSERT INTO invoices (
        invoice_number, invoice_type, customer_id, vendor_id, project_id,
        invoice_date, due_date, subtotal, tax_amount, discount_amount,
        total_amount, balance, currency, exchange_rate, notes, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        invoice_number, invoice_type, customer_id, vendor_id, project_id,
        invoice_date, due_date, subtotal, tax_amount || 0, discount_amount || 0,
        total_amount, total_amount, currency || 'USD', exchange_rate || 1.0,
        notes, req.user.id
      ]
    );

    // If project is linked, update project spent
    if (project_id && invoice_type === 'Payable') {
      await client.query(
        'UPDATE projects SET spent = spent + $1 WHERE id = $2',
        [total_amount, project_id]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: {
        invoice: result.rows[0]
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create invoice',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// Update Invoice Status
exports.updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await db.query(
      'UPDATE invoices SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      message: 'Invoice status updated successfully',
      data: {
        invoice: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Update invoice status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update invoice status',
      error: error.message
    });
  }
};

// Create Payment
exports.createPayment = async (req, res) => {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const {
      payment_number,
      invoice_id,
      payment_date,
      amount,
      currency,
      exchange_rate,
      payment_method,
      reference_number,
      notes
    } = req.body;

    // Validation
    if (!payment_number || !invoice_id || !payment_date || !amount) {
      throw new Error('Please provide all required fields');
    }

    // Get invoice
    const invoiceResult = await client.query(
      'SELECT * FROM invoices WHERE id = $1',
      [invoice_id]
    );

    if (invoiceResult.rows.length === 0) {
      throw new Error('Invoice not found');
    }

    const invoice = invoiceResult.rows[0];

    if (parseFloat(amount) > parseFloat(invoice.balance)) {
      throw new Error('Payment amount exceeds invoice balance');
    }

    // Create payment
    const paymentResult = await client.query(
      `INSERT INTO payments (
        payment_number, invoice_id, payment_date, amount,
        currency, exchange_rate, payment_method, reference_number,
        notes, status, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        payment_number, invoice_id, payment_date, amount,
        currency || 'USD', exchange_rate || 1.0, payment_method,
        reference_number, notes, 'Completed', req.user.id
      ]
    );

    // Update invoice
    const newBalance = parseFloat(invoice.balance) - parseFloat(amount);
    const newPaidAmount = parseFloat(invoice.paid_amount) + parseFloat(amount);
    const newStatus = newBalance <= 0.01 ? 'Paid' : invoice.status;

    await client.query(
      'UPDATE invoices SET paid_amount = $1, balance = $2, status = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4',
      [newPaidAmount, newBalance, newStatus, invoice_id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      data: {
        payment: paymentResult.rows[0]
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// Get Payments
exports.getPayments = async (req, res) => {
  try {
    const { invoice_id, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        p.*,
        i.invoice_number,
        i.invoice_type
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (invoice_id) {
      paramCount++;
      query += ` AND p.invoice_id = $${paramCount}`;
      params.push(invoice_id);
    }

    if (status) {
      paramCount++;
      query += ` AND p.status = $${paramCount}`;
      params.push(status);
    }

    const countQuery = query.replace(
      'SELECT p.*, i.invoice_number, i.invoice_type',
      'SELECT COUNT(*)'
    );
    const countResult = await db.query(countQuery, params);

    query += ` ORDER BY p.payment_date DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: {
        payments: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(countResult.rows[0].count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
      error: error.message
    });
  }
};