import React, { useState, useEffect } from 'react';
import Card from '../../components/Common/Card';
import LineChart from '../../components/Charts/LineChart';
import PieChart from '../../components/Charts/PieChart';
import BarChart from '../../components/Charts/BarChart';
import projectService from '../../services/projectService';
import { formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';

const FinanceDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const response = await projectService.getFinancialDashboard();
      setData(response.data.data);
    } catch (error) {
      toast.error('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Revenue vs Expenses Chart
  const revenueExpensesData = {
    labels: data?.revenueExpenses?.map((d) => d.month) || [],
    datasets: [
      {
        label: 'Revenue',
        data: data?.revenueExpenses?.map((d) => parseFloat(d.revenue)) || [],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
      },
      {
        label: 'Expenses',
        data: data?.revenueExpenses?.map((d) => parseFloat(d.expenses)) || [],
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
      },
    ],
  };

  // Account Balances Pie Chart
  const accountBalancesData = {
    labels: data?.accountBalances?.map((d) => d.account_type) || [],
    datasets: [
      {
        data: data?.accountBalances?.map((d) => parseFloat(d.total_balance)) || [],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(168, 85, 247, 0.8)',
        ],
      },
    ],
  };

  // Receivables Aging
  const receivablesAgingData = {
    labels: data?.receivablesAging?.map((d) => d.aging_bucket) || [],
    datasets: [
      {
        label: 'Amount',
        data: data?.receivablesAging?.map((d) => parseFloat(d.total_amount)) || [],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
      },
    ],
  };

  // Payables Aging
  const payablesAgingData = {
    labels: data?.payablesAging?.map((d) => d.aging_bucket) || [],
    datasets: [
      {
        label: 'Amount',
        data: data?.payablesAging?.map((d) => parseFloat(d.total_amount)) || [],
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of financial performance</p>
      </div>

      {/* Revenue vs Expenses */}
      <Card title="Revenue vs Expenses" subtitle="Last 12 months">
        <LineChart data={revenueExpensesData} height={300} />
      </Card>

      {/* Account Balances and Top Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Account Balances by Type">
          <PieChart data={accountBalancesData} height={300} />
        </Card>

        <Card title="Top Customers by Revenue">
          <div className="space-y-4">
            {data?.topCustomers?.map((customer, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {index + 1}
                  </div>
                  <span className="font-medium">{customer.customer_name}</span>
                </div>
                <span className="text-green-600 font-semibold">
                  {formatCurrency(customer.total_revenue)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Aging Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Receivables Aging" subtitle="Outstanding customer invoices">
          <BarChart data={receivablesAgingData} height={250} />
        </Card>

        <Card title="Payables Aging" subtitle="Outstanding vendor bills">
          <BarChart data={payablesAgingData} height={250} />
        </Card>
      </div>
    </div>
  );
};

export default FinanceDashboard;