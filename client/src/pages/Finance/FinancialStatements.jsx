import React, { useState, useEffect } from 'react';
import { FaDownload } from 'react-icons/fa';
import Card from '../../components/Common/Card';
import Button from '../../components/Common/Button';
import Input from '../../components/Common/Input';
import financeService from '../../services/financeService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const FinancialStatements = () => {
  const [activeTab, setActiveTab] = useState('balance-sheet');
  const [balanceSheet, setBalanceSheet] = useState(null);
  const [profitLoss, setProfitLoss] = useState(null);
  const [cashFlow, setCashFlow] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start_date: '2024-01-01',
    end_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadStatements();
  }, [activeTab]);

  const loadStatements = async () => {
    setLoading(true);
    try {
      if (activeTab === 'balance-sheet') {
        const response = await financeService.getBalanceSheet();
        setBalanceSheet(response.data.data.balanceSheet);
      } else if (activeTab === 'profit-loss') {
        const response = await financeService.getProfitLoss(dateRange);
        setProfitLoss(response.data.data.profitLoss);
      } else if (activeTab === 'cash-flow') {
        const response = await financeService.getCashFlow({ months: 12 });
        setCashFlow(response.data.data.cashFlow);
      }
    } catch (error) {
      toast.error('Failed to load financial statement');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'balance-sheet', label: 'Balance Sheet' },
    { id: 'profit-loss', label: 'Profit & Loss' },
    { id: 'cash-flow', label: 'Cash Flow' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Statements</h1>
          <p className="text-gray-600 mt-1">View financial reports</p>
        </div>
        <Button icon={<FaDownload />}>Export PDF</Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Balance Sheet */}
      {activeTab === 'balance-sheet' && balanceSheet && (
        <Card title="Balance Sheet" subtitle={`As of ${formatDate(balanceSheet.as_of_date || new Date())}`}>
          <div className="space-y-6">
            {/* Assets */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Assets</h3>
              <table className="min-w-full">
                <tbody className="divide-y divide-gray-200">
                  {balanceSheet.assets?.accounts?.map((account) => (
                    <tr key={account.account_code}>
                      <td className="py-2 text-sm text-gray-900">{account.account_name}</td>
                      <td className="py-2 text-sm text-gray-500 text-right">{account.account_code}</td>
                      <td className="py-2 text-sm text-gray-900 text-right font-medium">
                        {formatCurrency(account.balance)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-semibold">
                    <td className="py-3 text-sm text-gray-900" colSpan="2">Total Assets</td>
                    <td className="py-3 text-sm text-gray-900 text-right">
                      {formatCurrency(balanceSheet.assets?.total)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Liabilities */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Liabilities</h3>
              <table className="min-w-full">
                <tbody className="divide-y divide-gray-200">
                  {balanceSheet.liabilities?.accounts?.map((account) => (
                    <tr key={account.account_code}>
                      <td className="py-2 text-sm text-gray-900">{account.account_name}</td>
                      <td className="py-2 text-sm text-gray-500 text-right">{account.account_code}</td>
                      <td className="py-2 text-sm text-gray-900 text-right font-medium">
                        {formatCurrency(account.balance)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-semibold">
                    <td className="py-3 text-sm text-gray-900" colSpan="2">Total Liabilities</td>
                    <td className="py-3 text-sm text-gray-900 text-right">
                      {formatCurrency(balanceSheet.liabilities?.total)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Equity */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Equity</h3>
              <table className="min-w-full">
                <tbody className="divide-y divide-gray-200">
                  {balanceSheet.equity?.accounts?.map((account) => (
                    <tr key={account.account_code}>
                      <td className="py-2 text-sm text-gray-900">{account.account_name}</td>
                      <td className="py-2 text-sm text-gray-500 text-right">{account.account_code}</td>
                      <td className="py-2 text-sm text-gray-900 text-right font-medium">
                        {formatCurrency(account.balance)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-semibold">
                    <td className="py-3 text-sm text-gray-900" colSpan="2">Total Equity</td>
                    <td className="py-3 text-sm text-gray-900 text-right">
                      {formatCurrency(balanceSheet.equity?.total)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="border-t-2 border-gray-900 pt-3">
              <div className="flex justify-between items-center font-bold text-lg">
                <span>Total Liabilities & Equity</span>
                <span>{formatCurrency((balanceSheet.liabilities?.total || 0) + (balanceSheet.equity?.total || 0))}</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Profit & Loss */}
      {activeTab === 'profit-loss' && profitLoss && (
        <Card 
          title="Profit & Loss Statement" 
          subtitle={`${formatDate(profitLoss.period?.start_date)} to ${formatDate(profitLoss.period?.end_date)}`}
        >
          <div className="space-y-6">
            {/* Revenue */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Revenue</h3>
              <table className="min-w-full">
                <tbody className="divide-y divide-gray-200">
                  {profitLoss.revenue?.accounts?.map((account) => (
                    <tr key={account.account_code}>
                      <td className="py-2 text-sm text-gray-900">{account.account_name}</td>
                      <td className="py-2 text-sm text-gray-500 text-right">{account.account_code}</td>
                      <td className="py-2 text-sm text-gray-900 text-right font-medium">
                        {formatCurrency(account.balance)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-green-50 font-semibold">
                    <td className="py-3 text-sm text-gray-900" colSpan="2">Total Revenue</td>
                    <td className="py-3 text-sm text-green-600 text-right">
                      {formatCurrency(profitLoss.revenue?.total)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Expenses */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Expenses</h3>
              <table className="min-w-full">
                <tbody className="divide-y divide-gray-200">
                  {profitLoss.expenses?.accounts?.map((account) => (
                    <tr key={account.account_code}>
                      <td className="py-2 text-sm text-gray-900">{account.account_name}</td>
                      <td className="py-2 text-sm text-gray-500 text-right">{account.account_code}</td>
                      <td className="py-2 text-sm text-gray-900 text-right font-medium">
                        {formatCurrency(account.balance)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-red-50 font-semibold">
                    <td className="py-3 text-sm text-gray-900" colSpan="2">Total Expenses</td>
                    <td className="py-3 text-sm text-red-600 text-right">
                      {formatCurrency(profitLoss.expenses?.total)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Net Income */}
            <div className="border-t-2 border-gray-900 pt-3">
              <div className="flex justify-between items-center font-bold text-lg">
                <span>Net Income</span>
                <span className={profitLoss.net_income >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(profitLoss.net_income)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-600 mt-2">
                <span>Profit Margin</span>
                <span>{profitLoss.profit_margin}%</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Cash Flow */}
      {activeTab === 'cash-flow' && cashFlow && (
        <Card title="Cash Flow Statement" subtitle="Last 12 months">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cash Inflow</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cash Outflow</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Cash Flow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {cashFlow.map((row, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 text-sm text-gray-900">{row.month}</td>
                  <td className="px-6 py-4 text-sm text-green-600 text-right font-medium">
                    {formatCurrency(row.cash_inflow)}
                  </td>
                  <td className="px-6 py-4 text-sm text-red-600 text-right font-medium">
                    {formatCurrency(row.cash_outflow)}
                  </td>
                  <td className={`px-6 py-4 text-sm text-right font-medium ${
                    parseFloat(row.net_cash_flow) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(row.net_cash_flow)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};

export default FinancialStatements;