import React, { useState, useEffect } from 'react';
import { FaPlus, FaEye } from 'react-icons/fa';
import Card from '../../components/Common/Card';
import Table from '../../components/Common/Table';
import Button from '../../components/Common/Button';
import Badge from '../../components/Common/Badge';
import Modal from '../../components/Common/Modal';
import Input from '../../components/Common/Input';
import Select from '../../components/Common/Select';
import projectService from '../../services/projectService';
import financeService from '../../services/financeService';
import { formatCurrency, formatDate, getStatusColor, getOverdueDays } from '../../utils/formatters';
import toast from 'react-hot-toast';

const AccountsReceivable = () => {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [formData, setFormData] = useState({
    invoice_number: '',
    customer_id: '',
    project_id: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    subtotal: '',
    tax_amount: '',
    discount_amount: '',
    notes: '',
  });
  const [paymentData, setPaymentData] = useState({
    payment_number: '',
    payment_date: new Date().toISOString().split('T')[0],
    amount: '',
    payment_method: 'Bank Transfer',
    reference_number: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invoicesRes, customersRes, projectsRes] = await Promise.all([
        projectService.getInvoices({ invoice_type: 'Receivable' }),
        financeService.getCustomers(),
        projectService.getProjects({ status: 'Active' }),
      ]);
      setInvoices(invoicesRes.data.data.invoices);
      setCustomers(customersRes.data.data.customers);
      setProjects(projectsRes.data.data.projects);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const total_amount = parseFloat(formData.subtotal) + 
                          parseFloat(formData.tax_amount || 0) - 
                          parseFloat(formData.discount_amount || 0);

      await projectService.createInvoice({
        ...formData,
        invoice_type: 'Receivable',
        total_amount,
      });
      toast.success('Invoice created successfully');
      setShowCreateModal(false);
      setFormData({
        invoice_number: '',
        customer_id: '',
        project_id: '',
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: '',
        subtotal: '',
        tax_amount: '',
        discount_amount: '',
        notes: '',
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create invoice');
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();

    try {
      await projectService.createPayment({
        ...paymentData,
        invoice_id: selectedInvoice.id,
      });
      toast.success('Payment recorded successfully');
      setShowPaymentModal(false);
      setPaymentData({
        payment_number: '',
        payment_date: new Date().toISOString().split('T')[0],
        amount: '',
        payment_method: 'Bank Transfer',
        reference_number: '',
        notes: '',
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record payment');
    }
  };

  const openPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentData((prev) => ({
      ...prev,
      amount: invoice.balance,
    }));
    setShowPaymentModal(true);
  };

  const columns = [
    {
      header: 'Invoice #',
      accessor: 'invoice_number',
    },
    {
      header: 'Customer',
      accessor: 'customer_name',
    },
    {
      header: 'Project',
      accessor: 'project_name',
    },
    {
      header: 'Invoice Date',
      render: (row) => formatDate(row.invoice_date),
    },
    {
      header: 'Due Date',
      render: (row) => (
        <div>
          <div>{formatDate(row.due_date)}</div>
          {row.status === 'Overdue' && (
            <div className="text-xs text-red-600">
              {getOverdueDays(row.due_date)} days overdue
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Amount',
      render: (row) => formatCurrency(row.total_amount),
    },
    {
      header: 'Paid',
      render: (row) => formatCurrency(row.paid_amount),
    },
    {
      header: 'Balance',
      render: (row) => (
        <span className="font-semibold text-red-600">
          {formatCurrency(row.balance)}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (row) => <Badge variant={getStatusColor(row.status)}>{row.status}</Badge>,
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex space-x-2">
          {row.balance > 0 && (
            <Button size="sm" onClick={() => openPaymentModal(row)}>
              Record Payment
            </Button>
          )}
        </div>
      ),
    },
  ];

  const customerOptions = customers.map((c) => ({ value: c.id, label: c.customer_name }));
  const projectOptions = projects.map((p) => ({ value: p.id, label: p.project_name }));
  const paymentMethodOptions = [
    { value: 'Bank Transfer', label: 'Bank Transfer' },
    { value: 'Check', label: 'Check' },
    { value: 'Cash', label: 'Cash' },
    { value: 'Credit Card', label: 'Credit Card' },
  ];

  // Calculate summary
  const summary = {
    total: invoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0),
    paid: invoices.reduce((sum, inv) => sum + parseFloat(inv.paid_amount), 0),
    outstanding: invoices.reduce((sum, inv) => sum + parseFloat(inv.balance), 0),
    overdue: invoices.filter((inv) => inv.status === 'Overdue').reduce((sum, inv) => sum + parseFloat(inv.balance), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Accounts Receivable</h1>
          <p className="text-gray-600 mt-1">Manage customer invoices and payments</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} icon={<FaPlus />}>
          New Invoice
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div>
            <p className="text-sm font-medium text-gray-600">Total Invoiced</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(summary.total)}</p>
          </div>
        </Card>
        <Card>
          <div>
            <p className="text-sm font-medium text-gray-600">Total Paid</p>
            <p className="text-2xl font-bold text-green-600 mt-2">{formatCurrency(summary.paid)}</p>
          </div>
        </Card>
        <Card>
          <div>
            <p className="text-sm font-medium text-gray-600">Outstanding</p>
            <p className="text-2xl font-bold text-orange-600 mt-2">{formatCurrency(summary.outstanding)}</p>
          </div>
        </Card>
        <Card>
          <div>
            <p className="text-sm font-medium text-gray-600">Overdue</p>
            <p className="text-2xl font-bold text-red-600 mt-2">{formatCurrency(summary.overdue)}</p>
          </div>
        </Card>
      </div>

      <Card>
        <Table columns={columns} data={invoices} loading={loading} emptyMessage="No invoices found" />
      </Card>

      {/* Create Invoice Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Customer Invoice"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Create Invoice</Button>
          </>
        }
      >
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Invoice Number"
              name="invoice_number"
              value={formData.invoice_number}
              onChange={handleChange}
              placeholder="INV-2024-001"
              required
            />
            <Select
              label="Customer"
              name="customer_id"
              value={formData.customer_id}
              onChange={handleChange}
              options={customerOptions}
              required
            />
          </div>

          <Select
            label="Project"
            name="project_id"
            value={formData.project_id}
            onChange={handleChange}
            options={projectOptions}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Invoice Date"
              name="invoice_date"
              type="date"
              value={formData.invoice_date}
              onChange={handleChange}
              required
            />
            <Input
              label="Due Date"
              name="due_date"
              type="date"
              value={formData.due_date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Subtotal"
              name="subtotal"
              type="number"
              value={formData.subtotal}
              onChange={handleChange}
              placeholder="0.00"
              required
            />
            <Input
              label="Tax Amount"
              name="tax_amount"
              type="number"
              value={formData.tax_amount}
              onChange={handleChange}
              placeholder="0.00"
            />
            <Input
              label="Discount"
              name="discount_amount"
              type="number"
              value={formData.discount_amount}
              onChange={handleChange}
              placeholder="0.00"
            />
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between text-lg font-semibold">
              <span>Total Amount:</span>
              <span>
                {formatCurrency(
                  parseFloat(formData.subtotal || 0) +
                    parseFloat(formData.tax_amount || 0) -
                    parseFloat(formData.discount_amount || 0)
                )}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Invoice notes..."
            />
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title={`Record Payment - ${selectedInvoice?.invoice_number}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
            <Button onClick={handleRecordPayment}>Record Payment</Button>
          </>
        }
      >
        <form className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Invoice Amount:</span>
              <span className="font-semibold">{formatCurrency(selectedInvoice?.total_amount)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Already Paid:</span>
              <span className="font-semibold">{formatCurrency(selectedInvoice?.paid_amount)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-red-600">
              <span>Outstanding Balance:</span>
              <span>{formatCurrency(selectedInvoice?.balance)}</span>
            </div>
          </div>

          <Input
            label="Payment Number"
            name="payment_number"
            value={paymentData.payment_number}
            onChange={handlePaymentChange}
            placeholder="PAY-2024-001"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Payment Date"
              name="payment_date"
              type="date"
              value={paymentData.payment_date}
              onChange={handlePaymentChange}
              required
            />
            <Input
              label="Amount"
              name="amount"
              type="number"
              value={paymentData.amount}
              onChange={handlePaymentChange}
              placeholder="0.00"
              required
            />
          </div>

          <Select
            label="Payment Method"
            name="payment_method"
            value={paymentData.payment_method}
            onChange={handlePaymentChange}
            options={paymentMethodOptions}
            required
          />

          <Input
            label="Reference Number"
            name="reference_number"
            value={paymentData.reference_number}
            onChange={handlePaymentChange}
            placeholder="Check number, transaction ID, etc."
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              value={paymentData.notes}
              onChange={handlePaymentChange}
              rows="3"
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Payment notes..."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AccountsReceivable;