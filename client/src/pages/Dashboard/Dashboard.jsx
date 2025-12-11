import React, { useState, useEffect } from 'react';
import {
  FaProjectDiagram,
  FaMoneyBillWave,
  FaFileInvoiceDollar,
  FaExclamationTriangle,
} from 'react-icons/fa';
import Card from '../../components/Common/Card';
import LineChart from '../../components/Charts/LineChart';
import BarChart from '../../components/Charts/BarChart';
import Table from '../../components/Common/Table';
import Badge from '../../components/Common/Badge';
import projectService from '../../services/projectService';
import { formatCurrency, formatDate, getStatusColor } from '../../utils/formatters';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await projectService.getDashboardKPIs();
      setKpis(response.data.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error('Dashboard error:', error);
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

  // KPI Cards Data
  const kpiCards = [
    {
      title: 'Total Projects',
      value: kpis?.projects?.total_projects || 0,
      subtitle: `${kpis?.projects?.active_projects || 0} Active`,
      icon: <FaProjectDiagram className="text-blue-600" size={32} />,
      color: 'bg-blue-50',
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(kpis?.financial?.total_revenue || 0),
      subtitle: 'Paid Invoices',
      icon: <FaMoneyBillWave className="text-green-600" size={32} />,
      color: 'bg-green-50',
    },
    {
      title: 'Outstanding Receivables',
      value: formatCurrency(kpis?.financial?.outstanding_receivables || 0),
      subtitle: 'Pending Collection',
      icon: <FaFileInvoiceDollar className="text-yellow-600" size={32} />,
      color: 'bg-yellow-50',
    },
    {
      title: 'Outstanding Payables',
      value: formatCurrency(kpis?.financial?.outstanding_payables || 0),
      subtitle: 'To Be Paid',
      icon: <FaExclamationTriangle className="text-red-600" size={32} />,
      color: 'bg-red-50',
    },
  ];

  // Cash Flow Chart Data
  const cashFlowData = {
    labels: kpis?.cashFlow?.map((cf) => cf.month) || [],
    datasets: [
      {
        label: 'Cash Inflow',
        data: kpis?.cashFlow?.map((cf) => parseFloat(cf.cash_inflow)) || [],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
      },
      {
        label: 'Cash Outflow',
        data: kpis?.cashFlow?.map((cf) => parseFloat(cf.cash_outflow)) || [],
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
      },
      {
        label: 'Net Cash Flow',
        data: kpis?.cashFlow?.map((cf) => parseFloat(cf.net_cash_flow)) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
      },
    ],
  };

  // Budget Overview Chart
  const budgetData = {
    labels: ['Total Budget', 'Total Spent', 'Remaining'],
    datasets: [
      {
        label: 'Budget Overview',
        data: [
          parseFloat(kpis?.budget?.total_budget || 0),
          parseFloat(kpis?.budget?.total_spent || 0),
          parseFloat(kpis?.budget?.remaining_budget || 0),
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(34, 197, 94, 0.8)',
        ],
      },
    ],
  };

  // Recent Invoices Table Columns
  const invoiceColumns = [
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
      header: 'Amount',
      render: (row) => formatCurrency(row.total_amount),
    },
    {
      header: 'Status',
      render: (row) => (
        <Badge variant={getStatusColor(row.status)}>{row.status}</Badge>
      ),
    },
    {
      header: 'Due Date',
      render: (row) => formatDate(row.due_date),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, index) => (
          <Card key={index} className={card.color}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{card.value}</p>
                <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
              </div>
              <div>{card.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Cash Flow Trend" subtitle="Last 6 months">
          <LineChart data={cashFlowData} height={300} />
        </Card>

        <Card title="Budget Overview" subtitle="Active projects">
          <BarChart data={budgetData} height={300} />
        </Card>
      </div>

      {/* Recent Invoices and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Recent Invoices" className="lg:col-span-2">
          <Table
            columns={invoiceColumns}
            data={kpis?.recentInvoices || []}
            emptyMessage="No recent invoices"
          />
        </Card>

        <Card title="Alerts" subtitle={`${kpis?.alerts?.length || 0} active alerts`}>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {kpis?.alerts?.map((alert, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border-l-4 ${
                  alert.severity === 'critical'
                    ? 'bg-red-50 border-red-500'
                    : alert.severity === 'high'
                    ? 'bg-orange-50 border-orange-500'
                    : 'bg-yellow-50 border-yellow-500'
                }`}
              >
                <div className="flex items-start">
                  <FaExclamationTriangle
                    className={`mt-0.5 mr-2 ${
                      alert.severity === 'critical'
                        ? 'text-red-600'
                        : alert.severity === 'high'
                        ? 'text-orange-600'
                        : 'text-yellow-600'
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{alert.alert_type}</p>
                    <p className="text-xs text-gray-600 mt-1">{alert.message}</p>
                    <p className="text-xs text-gray-500 mt-1">Ref: {alert.reference}</p>
                  </div>
                </div>
              </div>
            ))}
            {(!kpis?.alerts || kpis.alerts.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No active alerts</p>
                <p className="text-xs mt-1">All systems running smoothly</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;