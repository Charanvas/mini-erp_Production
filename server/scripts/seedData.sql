-- Clear existing data
TRUNCATE TABLE audit_logs, risk_logs, project_progress, payments, invoices, 
             journal_entries, transactions, projects, customers, vendors, 
             exchange_rates, users CASCADE;

-- Reset sequences
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE customers_id_seq RESTART WITH 1;
ALTER SEQUENCE vendors_id_seq RESTART WITH 1;
ALTER SEQUENCE projects_id_seq RESTART WITH 1;
ALTER SEQUENCE invoices_id_seq RESTART WITH 1;
ALTER SEQUENCE accounts_id_seq RESTART WITH 1;

-- Seed Default Users with CORRECT password hashes
-- Password for all users: Admin@123
-- Hash generated: $2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa
INSERT INTO users (username, email, password_hash, full_name, role) VALUES
('admin', 'admin@construction-erp.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'System Administrator', 'Admin'),
('finance', 'finance@construction-erp.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'Finance Manager', 'Finance Manager'),
('pm1', 'pm1@construction-erp.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'Project Manager One', 'Project Manager'),
('pm2', 'pm2@construction-erp.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'Project Manager Two', 'Project Manager'),
('user1', 'user1@construction-erp.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'Regular User', 'User');

-- Seed Chart of Accounts
INSERT INTO accounts (account_code, account_name, account_type, balance, currency) VALUES
-- Assets
('1000', 'Cash', 'Asset', 500000.00, 'USD'),
('1100', 'Accounts Receivable', 'Asset', 350000.00, 'USD'),
('1200', 'Inventory', 'Asset', 125000.00, 'USD'),
('1300', 'Equipment', 'Asset', 450000.00, 'USD'),
('1400', 'Buildings', 'Asset', 2000000.00, 'USD'),
('1500', 'Land', 'Asset', 1000000.00, 'USD'),

-- Liabilities
('2000', 'Accounts Payable', 'Liability', 180000.00, 'USD'),
('2100', 'Short-term Loans', 'Liability', 200000.00, 'USD'),
('2200', 'Long-term Debt', 'Liability', 800000.00, 'USD'),
('2300', 'Credit Line', 'Liability', 150000.00, 'USD'),

-- Equity
('3000', 'Owner Equity', 'Equity', 2000000.00, 'USD'),
('3100', 'Retained Earnings', 'Equity', 695000.00, 'USD'),

-- Revenue
('4000', 'Construction Revenue', 'Revenue', 1500000.00, 'USD'),
('4100', 'Service Revenue', 'Revenue', 300000.00, 'USD'),
('4200', 'Consulting Revenue', 'Revenue', 150000.00, 'USD'),

-- Expenses
('5000', 'Materials Cost', 'Expense', 400000.00, 'USD'),
('5100', 'Labor Cost', 'Expense', 550000.00, 'USD'),
('5200', 'Equipment Rental', 'Expense', 120000.00, 'USD'),
('5300', 'Utilities', 'Expense', 35000.00, 'USD'),
('5400', 'Insurance', 'Expense', 45000.00, 'USD'),
('5500', 'Administrative Expenses', 'Expense', 85000.00, 'USD'),
('5600', 'Marketing Expenses', 'Expense', 25000.00, 'USD');

-- Seed Customers
INSERT INTO customers (customer_code, customer_name, contact_person, email, phone, address, city, country, credit_limit, payment_terms, currency) VALUES
('CUST001', 'ABC Corporation', 'John Smith', 'john@abc.com', '+1-555-0101', '123 Business St', 'New York', 'USA', 1000000.00, 30, 'USD'),
('CUST002', 'XYZ Industries', 'Jane Doe', 'jane@xyz.com', '+1-555-0102', '456 Commerce Ave', 'Los Angeles', 'USA', 1500000.00, 45, 'USD'),
('CUST003', 'Global Enterprises', 'Bob Johnson', 'bob@global.com', '+1-555-0103', '789 Trade Blvd', 'Chicago', 'USA', 2000000.00, 60, 'USD'),
('CUST004', 'Tech Innovations Ltd', 'Alice Cooper', 'alice@techinno.com', '+1-555-0104', '321 Silicon Valley', 'San Francisco', 'USA', 2500000.00, 30, 'USD'),
('CUST005', 'Green Buildings Inc', 'Charlie Green', 'charlie@greenbuildings.com', '+1-555-0105', '654 Eco Drive', 'Seattle', 'USA', 1800000.00, 45, 'USD'),
('CUST006', 'Modern Spaces Corp', 'Diana White', 'diana@modernspaces.com', '+1-555-0106', '987 Design Lane', 'Boston', 'USA', 2200000.00, 30, 'USD');

-- Seed Vendors
INSERT INTO vendors (vendor_code, vendor_name, contact_person, email, phone, address, city, country, payment_terms, currency) VALUES
('VEND001', 'Steel Supplies Inc', 'Mike Williams', 'mike@steel.com', '+1-555-0201', '321 Industrial Rd', 'Pittsburgh', 'USA', 30, 'USD'),
('VEND002', 'Concrete Solutions', 'Sarah Brown', 'sarah@concrete.com', '+1-555-0202', '654 Builder Lane', 'Houston', 'USA', 15, 'USD'),
('VEND003', 'Equipment Rentals Co', 'Tom Davis', 'tom@equiprent.com', '+1-555-0203', '987 Machinery Dr', 'Detroit', 'USA', 7, 'USD'),
('VEND004', 'Lumber Suppliers Co', 'Emma Wilson', 'emma@lumber.com', '+1-555-0204', '147 Wood Street', 'Portland', 'USA', 30, 'USD'),
('VEND005', 'Electrical Systems Ltd', 'Frank Miller', 'frank@electrical.com', '+1-555-0205', '258 Power Ave', 'Denver', 'USA', 30, 'USD'),
('VEND006', 'Plumbing Experts Inc', 'Grace Taylor', 'grace@plumbing.com', '+1-555-0206', '369 Pipe Road', 'Phoenix', 'USA', 30, 'USD');

-- Seed Projects
INSERT INTO projects (project_code, project_name, customer_id, project_manager_id, budget, spent, status, start_date, end_date, planned_progress, actual_progress, location, description) VALUES
('PRJ001', 'Downtown Office Complex', 1, 3, 2500000.00, 875000.00, 'Active', '2024-01-15', '2024-12-31', 40.00, 35.00, 'New York, NY', '15-story office building with modern amenities'),
('PRJ002', 'Residential Towers Phase 1', 2, 3, 5000000.00, 1500000.00, 'Active', '2024-02-01', '2025-06-30', 30.00, 32.00, 'Los Angeles, CA', 'Luxury residential towers with 200 units'),
('PRJ003', 'Shopping Mall Renovation', 3, 4, 1800000.00, 1650000.00, 'Active', '2023-09-01', '2024-05-31', 95.00, 92.00, 'Chicago, IL', 'Complete renovation of existing mall'),
('PRJ004', 'Bridge Construction', 1, 3, 3500000.00, 525000.00, 'Active', '2024-03-01', '2025-02-28', 18.00, 15.00, 'San Francisco, CA', 'New pedestrian and vehicle bridge'),
('PRJ005', 'Hospital Extension', 4, 4, 6000000.00, 600000.00, 'Planning', '2024-06-01', '2025-12-31', 8.00, 10.00, 'San Francisco, CA', 'New wing for emergency services'),
('PRJ006', 'University Campus Building', 5, 3, 4500000.00, 1800000.00, 'Active', '2023-10-01', '2024-08-31', 45.00, 40.00, 'Seattle, WA', 'New science and technology building'),
('PRJ007', 'Warehouse Complex', 6, 4, 2200000.00, 330000.00, 'Active', '2024-04-01', '2024-11-30', 20.00, 15.00, 'Boston, MA', 'Distribution center with cold storage'),
('PRJ008', 'Luxury Hotel', 2, 3, 8000000.00, 2400000.00, 'Active', '2023-08-01', '2025-03-31', 35.00, 30.00, 'Miami, FL', '5-star hotel with conference facilities');

-- Seed Invoices (Receivable)
INSERT INTO invoices (invoice_number, invoice_type, customer_id, project_id, invoice_date, due_date, subtotal, tax_amount, discount_amount, total_amount, paid_amount, balance, currency, status, created_by) VALUES
('INV-2024-001', 'Receivable', 1, 1, '2024-01-20', '2024-02-19', 250000.00, 25000.00, 0.00, 275000.00, 275000.00, 0.00, 'USD', 'Paid', 1),
('INV-2024-002', 'Receivable', 1, 1, '2024-02-20', '2024-03-21', 300000.00, 30000.00, 0.00, 330000.00, 330000.00, 0.00, 'USD', 'Paid', 1),
('INV-2024-003', 'Receivable', 2, 2, '2024-02-15', '2024-04-15', 500000.00, 50000.00, 0.00, 550000.00, 0.00, 550000.00, 'USD', 'Sent', 1),
('INV-2024-004', 'Receivable', 2, 2, '2024-03-20', '2024-05-04', 450000.00, 45000.00, 0.00, 495000.00, 0.00, 495000.00, 'USD', 'Overdue', 1),
('INV-2024-005', 'Receivable', 3, 3, '2024-01-10', '2024-02-09', 600000.00, 60000.00, 10000.00, 650000.00, 650000.00, 0.00, 'USD', 'Paid', 1),
('INV-2024-006', 'Receivable', 3, 3, '2024-02-10', '2024-03-11', 550000.00, 55000.00, 0.00, 605000.00, 605000.00, 0.00, 'USD', 'Paid', 1),
('INV-2024-007', 'Receivable', 4, 5, '2024-03-15', '2024-04-14', 300000.00, 30000.00, 0.00, 330000.00, 0.00, 330000.00, 'USD', 'Sent', 1),
('INV-2024-008', 'Receivable', 5, 6, '2024-02-25', '2024-04-10', 800000.00, 80000.00, 20000.00, 860000.00, 0.00, 860000.00, 'USD', 'Overdue', 1),
('INV-2024-009', 'Receivable', 6, 7, '2024-03-30', '2024-04-29', 200000.00, 20000.00, 0.00, 220000.00, 0.00, 220000.00, 'USD', 'Sent', 1),
('INV-2024-010', 'Receivable', 2, 8, '2024-03-10', '2024-04-24', 1200000.00, 120000.00, 50000.00, 1270000.00, 0.00, 1270000.00, 'USD', 'Overdue', 1);

-- Seed Invoices (Payable)
INSERT INTO invoices (invoice_number, invoice_type, vendor_id, project_id, invoice_date, due_date, subtotal, tax_amount, total_amount, paid_amount, balance, currency, status, created_by) VALUES
('BILL-2024-001', 'Payable', 1, 1, '2024-01-10', '2024-02-09', 150000.00, 15000.00, 165000.00, 165000.00, 0.00, 'USD', 'Paid', 1),
('BILL-2024-002', 'Payable', 2, 1, '2024-01-15', '2024-01-30', 80000.00, 8000.00, 88000.00, 88000.00, 0.00, 'USD', 'Paid', 1),
('BILL-2024-003', 'Payable', 3, 2, '2024-02-20', '2024-02-27', 120000.00, 12000.00, 132000.00, 132000.00, 0.00, 'USD', 'Paid', 1),
('BILL-2024-004', 'Payable', 4, 3, '2024-02-10', '2024-03-11', 200000.00, 20000.00, 220000.00, 0.00, 220000.00, 'USD', 'Sent', 1),
('BILL-2024-005', 'Payable', 5, 4, '2024-03-15', '2024-04-14', 175000.00, 17500.00, 192500.00, 0.00, 192500.00, 'USD', 'Sent', 1),
('BILL-2024-006', 'Payable', 6, 5, '2024-03-20', '2024-04-19', 250000.00, 25000.00, 275000.00, 0.00, 275000.00, 'USD', 'Sent', 1);

-- Seed Payments
INSERT INTO payments (payment_number, invoice_id, payment_date, amount, currency, payment_method, reference_number, status, created_by) VALUES
('PAY-2024-001', 1, '2024-02-15', 275000.00, 'USD', 'Bank Transfer', 'TRX-001-2024', 'Completed', 1),
('PAY-2024-002', 2, '2024-03-18', 330000.00, 'USD', 'Bank Transfer', 'TRX-002-2024', 'Completed', 1),
('PAY-2024-003', 5, '2024-02-08', 650000.00, 'USD', 'Check', 'CHK-12345', 'Completed', 1),
('PAY-2024-004', 6, '2024-03-10', 605000.00, 'USD', 'Bank Transfer', 'TRX-003-2024', 'Completed', 1),
('PAY-2024-005', 11, '2024-02-08', 165000.00, 'USD', 'Bank Transfer', 'TRX-004-2024', 'Completed', 1),
('PAY-2024-006', 12, '2024-01-29', 88000.00, 'USD', 'Check', 'CHK-12346', 'Completed', 1),
('PAY-2024-007', 13, '2024-02-26', 132000.00, 'USD', 'Bank Transfer', 'TRX-005-2024', 'Completed', 1);

-- Seed Exchange Rates
INSERT INTO exchange_rates (from_currency, to_currency, rate, effective_date) VALUES
('USD', 'EUR', 0.92, CURRENT_DATE),
('USD', 'GBP', 0.79, CURRENT_DATE),
('USD', 'JPY', 149.50, CURRENT_DATE),
('USD', 'CAD', 1.35, CURRENT_DATE),
('USD', 'AUD', 1.52, CURRENT_DATE),
('EUR', 'USD', 1.09, CURRENT_DATE),
('GBP', 'USD', 1.27, CURRENT_DATE),
('CAD', 'USD', 0.74, CURRENT_DATE),
('AUD', 'USD', 0.66, CURRENT_DATE);

-- Seed Project Progress
INSERT INTO project_progress (project_id, progress_date, planned_progress, actual_progress, budget_spent, notes, created_by) VALUES
(1, '2024-01-31', 10.00, 8.00, 250000.00, 'Initial phase completed with minor delays', 3),
(1, '2024-02-29', 20.00, 18.00, 500000.00, 'Foundation work completed', 3),
(1, '2024-03-31', 30.00, 25.00, 750000.00, 'Steel structure installation ongoing', 3),
(2, '2024-02-29', 15.00, 18.00, 750000.00, 'Ahead of schedule', 3),
(2, '2024-03-31', 25.00, 28.00, 1200000.00, 'Site preparation complete, construction started', 3),
(3, '2024-01-31', 70.00, 68.00, 1260000.00, 'Interior work progressing', 4),
(3, '2024-02-29', 85.00, 82.00, 1530000.00, 'Final touches and fixtures installation', 4),
(3, '2024-03-31', 95.00, 92.00, 1650000.00, 'Nearing completion', 4),
(6, '2024-01-31', 20.00, 15.00, 900000.00, 'Ground breaking completed', 3),
(6, '2024-02-29', 30.00, 25.00, 1350000.00, 'Foundation laid', 3),
(6, '2024-03-31', 40.00, 35.00, 1800000.00, 'First floor construction started', 3);

-- Add some journal entries for realistic financial data
INSERT INTO journal_entries (entry_number, entry_date, description, reference, status, created_by, total_debit, total_credit) VALUES
('JE-2024-001', '2024-01-15', 'Materials purchase for Project 001', 'BILL-2024-001', 'Posted', 2, 150000.00, 150000.00),
('JE-2024-002', '2024-02-01', 'Revenue recognition for completed milestone', 'INV-2024-001', 'Posted', 2, 275000.00, 275000.00),
('JE-2024-003', '2024-03-01', 'Equipment purchase', 'PO-2024-001', 'Posted', 2, 100000.00, 100000.00);

INSERT INTO transactions (journal_entry_id, account_id, debit, credit, description) VALUES
-- JE-2024-001
(1, 8, 150000.00, 0.00, 'Materials inventory'),
(1, 1, 0.00, 150000.00, 'Cash payment'),
-- JE-2024-002
(2, 2, 275000.00, 0.00, 'Accounts receivable'),
(2, 13, 0.00, 275000.00, 'Construction revenue'),
-- JE-2024-003
(3, 4, 100000.00, 0.00, 'Equipment purchase'),
(3, 1, 0.00, 100000.00, 'Cash payment');

-- Success message
SELECT 'Database seeded successfully!' AS message;
SELECT 'Total Users: ' || COUNT(*) FROM users;
SELECT 'Total Projects: ' || COUNT(*) FROM projects;
SELECT 'Total Invoices: ' || COUNT(*) FROM invoices;
SELECT 'Total Customers: ' || COUNT(*) FROM customers;