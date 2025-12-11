import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaPlus } from 'react-icons/fa';
import Card from '../../components/Common/Card';
import Button from '../../components/Common/Button';
import Badge from '../../components/Common/Badge';
import Table from '../../components/Common/Table';
import Modal from '../../components/Common/Modal';
import Input from '../../components/Common/Input';
import LineChart from '../../components/Charts/LineChart';
import projectService from '../../services/projectService';
import { formatCurrency, formatDate, formatPercent, getStatusColor } from '../../utils/formatters';
import toast from 'react-hot-toast';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressData, setProgressData] = useState({
    progress_date: new Date().toISOString().split('T')[0],
    planned_progress: '',
    actual_progress: '',
    budget_spent: '',
    notes: '',
  });

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const response = await projectService.getProjectById(id);
      setProject(response.data.data.project);
      setProgressData((prev) => ({
        ...prev,
        planned_progress: response.data.data.project.planned_progress,
        actual_progress: response.data.data.project.actual_progress,
        budget_spent: response.data.data.project.spent,
      }));
    } catch (error) {
      toast.error('Failed to load project details');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleProgressChange = (e) => {
    const { name, value } = e.target;
    setProgressData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitProgress = async (e) => {
    e.preventDefault();
    try {
      await projectService.recordProgress(id, progressData);
      toast.success('Progress recorded successfully');
      setShowProgressModal(false);
      fetchProjectDetails();
    } catch (error) {
      toast.error('Failed to record progress');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!project) {
    return <div>Project not found</div>;
  }

  // Progress Chart Data
  const progressChartData = {
    labels: project.progress_history?.map((p) => formatDate(p.progress_date)) || [],
    datasets: [
      {
        label: 'Planned Progress',
        data: project.progress_history?.map((p) => parseFloat(p.planned_progress)) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
      },
      {
        label: 'Actual Progress',
        data: project.progress_history?.map((p) => parseFloat(p.actual_progress)) || [],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
      },
    ],
  };

  // Invoice Columns
  const invoiceColumns = [
    {
      header: 'Invoice #',
      accessor: 'invoice_number',
    },
    {
      header: 'Type',
      accessor: 'invoice_type',
    },
    {
      header: 'Date',
      render: (row) => formatDate(row.invoice_date),
    },
    {
      header: 'Amount',
      render: (row) => formatCurrency(row.total_amount),
    },
    {
      header: 'Balance',
      render: (row) => formatCurrency(row.balance),
    },
    {
      header: 'Status',
      render: (row) => <Badge variant={getStatusColor(row.status)}>{row.status}</Badge>,
    },
  ];

  const budgetUsagePercent = (project.spent / project.budget) * 100;
  const progressDeviation = project.actual_progress - project.planned_progress;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="secondary" onClick={() => navigate('/projects')} icon={<FaArrowLeft />}>
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.project_name}</h1>
            <p className="text-gray-600 mt-1">
              {project.project_code} • {project.customer_name}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Badge variant={getStatusColor(project.status)} size="lg">
            {project.status}
          </Badge>
          <Button onClick={() => setShowProgressModal(true)} icon={<FaPlus />}>
            Record Progress
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div>
            <p className="text-sm font-medium text-gray-600">Total Budget</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {formatCurrency(project.budget)}
            </p>
          </div>
        </Card>
        <Card>
          <div>
            <p className="text-sm font-medium text-gray-600">Amount Spent</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {formatCurrency(project.spent)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {formatPercent(budgetUsagePercent)} of budget
            </p>
          </div>
        </Card>
        <Card>
          <div>
            <p className="text-sm font-medium text-gray-600">Remaining Budget</p>
            <p className="text-2xl font-bold text-green-600 mt-2">
              {formatCurrency(project.budget - project.spent)}
            </p>
          </div>
        </Card>
        <Card>
          <div>
            <p className="text-sm font-medium text-gray-600">Progress Status</p>
            <p className={`text-2xl font-bold mt-2 ${progressDeviation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {progressDeviation >= 0 ? 'On Track' : 'Behind'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {Math.abs(progressDeviation).toFixed(1)}% {progressDeviation >= 0 ? 'ahead' : 'behind'}
            </p>
          </div>
        </Card>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Progress Tracking">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Planned Progress</span>
                <span className="text-blue-600">{formatPercent(project.planned_progress)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full"
                  style={{ width: `${project.planned_progress}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Actual Progress</span>
                <span className="text-green-600">{formatPercent(project.actual_progress)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full"
                  style={{ width: `${project.actual_progress}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Budget Usage</span>
                <span className={budgetUsagePercent > 90 ? 'text-red-600' : 'text-orange-600'}>
                  {formatPercent(budgetUsagePercent)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${budgetUsagePercent > 90 ? 'bg-red-600' : 'bg-orange-600'}`}
                  style={{ width: `${Math.min(budgetUsagePercent, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Project Information">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Project Code:</span>
              <span className="font-medium">{project.project_code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Customer:</span>
              <span className="font-medium">{project.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Project Manager:</span>
              <span className="font-medium">{project.project_manager_name || 'Not assigned'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Start Date:</span>
              <span className="font-medium">{formatDate(project.start_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">End Date:</span>
              <span className="font-medium">{formatDate(project.end_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Location:</span>
              <span className="font-medium">{project.location || 'N/A'}</span>
            </div>
          </div>
          {project.description && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600 mb-2">Description:</p>
              <p className="text-sm text-gray-900">{project.description}</p>
            </div>
          )}
        </Card>
      </div>

      {/* Progress History Chart */}
      <Card title="Progress History" subtitle="Planned vs Actual">
        <LineChart data={progressChartData} height={300} />
      </Card>

      {/* Project Invoices */}
      <Card title="Project Invoices" subtitle={`${project.invoices?.length || 0} invoices`}>
        <Table
          columns={invoiceColumns}
          data={project.invoices || []}
          emptyMessage="No invoices found"
        />
      </Card>

      {/* Record Progress Modal */}
      <Modal
        isOpen={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        title="Record Project Progress"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowProgressModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitProgress}>Save Progress</Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input
            label="Progress Date"
            name="progress_date"
            type="date"
            value={progressData.progress_date}
            onChange={handleProgressChange}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Planned Progress (%)"
              name="planned_progress"
              type="number"
              value={progressData.planned_progress}
              onChange={handleProgressChange}
              min="0"
              max="100"
              required
            />
            <Input
              label="Actual Progress (%)"
              name="actual_progress"
              type="number"
              value={progressData.actual_progress}
              onChange={handleProgressChange}
              min="0"
              max="100"
              required
            />
          </div>

          <Input
            label="Budget Spent"
            name="budget_spent"
            type="number"
            value={progressData.budget_spent}
            onChange={handleProgressChange}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              value={progressData.notes}
              onChange={handleProgressChange}
              rows="3"
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Progress notes..."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectDetails;