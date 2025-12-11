import React, { useState, useEffect } from 'react';
import { FaPlus } from 'react-icons/fa';
import Card from '../../components/Common/Card';
import Table from '../../components/Common/Table';
import Button from '../../components/Common/Button';
import Badge from '../../components/Common/Badge';
import Modal from '../../components/Common/Modal';
import Input from '../../components/Common/Input';
import Select from '../../components/Common/Select';
import financeService from '../../services/financeService';
import { formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';

const GeneralLedger = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    account_code: '',
    account_name: '',
    account_type: '',
    parent_account_id: '',
    currency: 'USD',
    description: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await financeService.getAccounts();
      setAccounts(response.data.data.accounts);
    } catch (error) {
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.account_code.trim()) newErrors.account_code = 'Account code is required';
    if (!formData.account_name.trim()) newErrors.account_name = 'Account name is required';
    if (!formData.account_type) newErrors.account_type = 'Account type is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await financeService.createAccount(formData);
      toast.success('Account created successfully');
      setShowCreateModal(false);
      setFormData({
        account_code: '',
        account_name: '',
        account_type: '',
        parent_account_id: '',
        currency: 'USD',
        description: '',
      });
      fetchAccounts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create account');
    }
  };

  const columns = [
    {
      header: 'Account Code',
      accessor: 'account_code',
    },
    {
      header: 'Account Name',
      accessor: 'account_name',
    },
    {
      header: 'Type',
      render: (row) => (
        <Badge variant={row.account_type === 'Asset' ? 'primary' : row.account_type === 'Revenue' ? 'success' : 'default'}>
          {row.account_type}
        </Badge>
      ),
    },
    {
      header: 'Balance',
      render: (row) => (
        <span className={parseFloat(row.balance) < 0 ? 'text-red-600' : 'text-green-600'}>
          {formatCurrency(row.balance)}
        </span>
      ),
    },
    {
      header: 'Currency',
      accessor: 'currency',
    },
    {
      header: 'Status',
      render: (row) => (
        <Badge variant={row.is_active ? 'success' : 'default'}>
          {row.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  const accountTypeOptions = [
    { value: 'Asset', label: 'Asset' },
    { value: 'Liability', label: 'Liability' },
    { value: 'Equity', label: 'Equity' },
    { value: 'Revenue', label: 'Revenue' },
    { value: 'Expense', label: 'Expense' },
  ];

  const parentAccountOptions = accounts
    .filter((acc) => !acc.parent_account_id)
    .map((acc) => ({
      value: acc.id,
      label: `${acc.account_code} - ${acc.account_name}`,
    }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Chart of Accounts</h1>
          <p className="text-gray-600 mt-1">Manage your accounting structure</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} icon={<FaPlus />}>
          New Account
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {accountTypeOptions.map((type) => {
          const typeAccounts = accounts.filter((acc) => acc.account_type === type.value);
          const totalBalance = typeAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
          return (
            <Card key={type.value}>
              <div>
                <p className="text-sm font-medium text-gray-600">{type.label}</p>
                <p className="text-xl font-bold text-gray-900 mt-2">{typeAccounts.length}</p>
                <p className="text-sm text-gray-500 mt-1">{formatCurrency(totalBalance)}</p>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <Table
          columns={columns}
          data={accounts}
          loading={loading}
          emptyMessage="No accounts found"
        />
      </Card>

      {/* Create Account Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Account"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Create Account</Button>
          </>
        }
      >
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Account Code"
              name="account_code"
              value={formData.account_code}
              onChange={handleChange}
              error={errors.account_code}
              placeholder="1000"
              required
            />
            <Input
              label="Account Name"
              name="account_name"
              value={formData.account_name}
              onChange={handleChange}
              error={errors.account_name}
              placeholder="Cash"
              required
            />
          </div>

          <Select
            label="Account Type"
            name="account_type"
            value={formData.account_type}
            onChange={handleChange}
            error={errors.account_type}
            options={accountTypeOptions}
            required
          />

          <Select
            label="Parent Account"
            name="parent_account_id"
            value={formData.parent_account_id}
            onChange={handleChange}
            options={parentAccountOptions}
            placeholder="None (Top-level account)"
          />

          <Input
            label="Currency"
            name="currency"
            value={formData.currency}
            onChange={handleChange}
            placeholder="USD"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Account description..."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default GeneralLedger;