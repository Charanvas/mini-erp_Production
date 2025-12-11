import React, { useState, useEffect } from 'react';
import { FaPlus, FaCheck } from 'react-icons/fa';
import Card from '../../components/Common/Card';
import Table from '../../components/Common/Table';
import Button from '../../components/Common/Button';
import Badge from '../../components/Common/Badge';
import Modal from '../../components/Common/Modal';
import Input from '../../components/Common/Input';
import Select from '../../components/Common/Select';
import financeService from '../../services/financeService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const JournalEntries = () => {
  const [entries, setEntries] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    entry_number: '',
    entry_date: new Date().toISOString().split('T')[0],
    description: '',
    reference: '',
  });
  const [transactions, setTransactions] = useState([
    { account_id: '', debit: '', credit: '', description: '' },
    { account_id: '', debit: '', credit: '', description: '' },
  ]);

  useEffect(() => {
    fetchJournalEntries();
    fetchAccounts();
  }, []);

  const fetchJournalEntries = async () => {
    try {
      setLoading(true);
      const response = await financeService.getJournalEntries();
      setEntries(response.data.data.journalEntries);
    } catch (error) {
      toast.error('Failed to load journal entries');
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await financeService.getAccounts();
      setAccounts(response.data.data.accounts);
    } catch (error) {
      console.error('Failed to load accounts');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTransactionChange = (index, field, value) => {
    const newTransactions = [...transactions];
    newTransactions[index][field] = value;
    
    // Clear opposite field when one is entered
    if (field === 'debit' && value) {
      newTransactions[index].credit = '';
    } else if (field === 'credit' && value) {
      newTransactions[index].debit = '';
    }
    
    setTransactions(newTransactions);
  };

  const addTransaction = () => {
    setTransactions([...transactions, { account_id: '', debit: '', credit: '', description: '' }]);
  };

  const removeTransaction = (index) => {
    if (transactions.length > 2) {
      setTransactions(transactions.filter((_, i) => i !== index));
    }
  };

  const calculateTotals = () => {
    const totalDebit = transactions.reduce((sum, t) => sum + parseFloat(t.debit || 0), 0);
    const totalCredit = transactions.reduce((sum, t) => sum + parseFloat(t.credit || 0), 0);
    return { totalDebit, totalCredit };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { totalDebit, totalCredit } = calculateTotals();
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      toast.error('Debits must equal credits');
      return;
    }

    if (transactions.some((t) => !t.account_id)) {
      toast.error('All transactions must have an account selected');
      return;
    }

    try {
      await financeService.createJournalEntry({
        ...formData,
        transactions: transactions.filter((t) => t.account_id),
      });
      toast.success('Journal entry created successfully');
      setShowCreateModal(false);
      setFormData({
        entry_number: '',
        entry_date: new Date().toISOString().split('T')[0],
        description: '',
        reference: '',
      });
      setTransactions([
        { account_id: '', debit: '', credit: '', description: '' },
        { account_id: '', debit: '', credit: '', description: '' },
      ]);
      fetchJournalEntries();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create journal entry');
    }
  };

  const handlePostEntry = async (id) => {
    if (!window.confirm('Are you sure you want to post this journal entry? This action cannot be undone.')) {
      return;
    }

    try {
      await financeService.postJournalEntry(id);
      toast.success('Journal entry posted successfully');
      fetchJournalEntries();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to post journal entry');
    }
  };

  const columns = [
    {
      header: 'Entry #',
      accessor: 'entry_number',
    },
    {
      header: 'Date',
      render: (row) => formatDate(row.entry_date),
    },
    {
      header: 'Description',
      accessor: 'description',
    },
    {
      header: 'Debit',
      render: (row) => formatCurrency(row.total_debit),
    },
    {
      header: 'Credit',
      render: (row) => formatCurrency(row.total_credit),
    },
    {
      header: 'Status',
      render: (row) => (
        <Badge variant={row.status === 'Posted' ? 'success' : 'warning'}>
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        row.status === 'Draft' && (
          <Button
            size="sm"
            onClick={() => handlePostEntry(row.id)}
            icon={<FaCheck />}
          >
            Post
          </Button>
        )
      ),
    },
  ];

  const accountOptions = accounts.map((acc) => ({
    value: acc.id,
    label: `${acc.account_code} - ${acc.account_name}`,
  }));

  const { totalDebit, totalCredit } = calculateTotals();
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Journal Entries</h1>
          <p className="text-gray-600 mt-1">Record financial transactions</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} icon={<FaPlus />}>
          New Entry
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          data={entries}
          loading={loading}
          emptyMessage="No journal entries found"
        />
      </Card>

      {/* Create Journal Entry Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Journal Entry"
        size="xl"
        footer={
          <>
            <div className="flex-1 text-left">
              <div className="text-sm">
                <span className="text-gray-600">Total Debit: </span>
                <span className="font-semibold">{formatCurrency(totalDebit)}</span>
                <span className="mx-2">|</span>
                <span className="text-gray-600">Total Credit: </span>
                <span className="font-semibold">{formatCurrency(totalCredit)}</span>
                <span className="mx-2">|</span>
                <span className={isBalanced ? 'text-green-600' : 'text-red-600'}>
                  {isBalanced ? '✓ Balanced' : '✗ Not Balanced'}
                </span>
              </div>
            </div>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!isBalanced}>
              Create Entry
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Entry Number"
              name="entry_number"
              value={formData.entry_number}
              onChange={handleChange}
              placeholder="JE-2024-001"
              required
            />
            <Input
              label="Entry Date"
              name="entry_date"
              type="date"
              value={formData.entry_date}
              onChange={handleChange}
              required
            />
          </div>

          <Input
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Journal entry description"
            required
          />

          <Input
            label="Reference"
            name="reference"
            value={formData.reference}
            onChange={handleChange}
            placeholder="Reference number or document"
          />

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">Transactions</h3>
              <Button size="sm" variant="outline" onClick={addTransaction}>
                Add Line
              </Button>
            </div>

            <div className="space-y-3">
              {transactions.map((transaction, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4">
                    <Select
                      label={index === 0 ? 'Account' : ''}
                      name="account_id"
                      value={transaction.account_id}
                      onChange={(e) => handleTransactionChange(index, 'account_id', e.target.value)}
                      options={accountOptions}
                      placeholder="Select account"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      label={index === 0 ? 'Debit' : ''}
                      type="number"
                      value={transaction.debit}
                      onChange={(e) => handleTransactionChange(index, 'debit', e.target.value)}
                      placeholder="0.00"
                      disabled={!!transaction.credit}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      label={index === 0 ? 'Credit' : ''}
                      type="number"
                      value={transaction.credit}
                      onChange={(e) => handleTransactionChange(index, 'credit', e.target.value)}
                      placeholder="0.00"
                      disabled={!!transaction.debit}
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      label={index === 0 ? 'Description' : ''}
                      value={transaction.description}
                      onChange={(e) => handleTransactionChange(index, 'description', e.target.value)}
                      placeholder="Note"
                    />
                  </div>
                  <div className="col-span-1">
                    {transactions.length > 2 && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => removeTransaction(index)}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default JournalEntries;