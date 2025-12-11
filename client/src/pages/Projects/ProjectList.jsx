import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaEye, FaEdit, FaTrash } from 'react-icons/fa';
import Card from '../../components/Common/Card';
import Table from '../../components/Common/Table';
import Button from '../../components/Common/Button';
import Badge from '../../components/Common/Badge';
import Modal from '../../components/Common/Modal';
import Input from '../../components/Common/Input';
import Select from '../../components/Common/Select';
import projectService from '../../services/projectService';
import financeService from '../../services/financeService';
import { formatCurrency, formatDate, formatPercent, getStatusColor } from '../../utils/formatters';
import toast from 'react-hot-toast';

const ProjectList = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    project_code: '',
    project_name: '',
    customer_id: '',
    budget: '',
    start_date: '',
    end_date: '',
    location: '',
    description: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchProjects();
    fetchCustomers();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectService.getProjects();
      setProjects(response.data.data.projects);
    } catch (error) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await financeService.getCustomers();
      setCustomers(response.data.data.customers);
    } catch (error) {
      console.error('Failed to load customers:', error);
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
    if (!formData.project_code.trim()) newErrors.project_code = 'Project code is required';
    if (!formData.project_name.trim()) newErrors.project_name = 'Project name is required';
    if (!formData.budget || parseFloat(formData.budget) <= 0) newErrors.budget = 'Valid budget is required';
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
      await projectService.createProject(formData);
      toast.success('Project created successfully');
      setShowCreateModal(false);
      setFormData({
        project_code: '',
        project_name: '',
        customer_id: '',
        budget: '',
        start_date: '',
        end_date: '',
        location: '',
        description: '',
      });
      fetchProjects();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create project');
    }
  };

  const handleViewProject = (project) => {
    navigate(`/projects/${project.id}`);
  };

  const columns = [
    {
      header: 'Project Code',
      accessor: 'project_code',
    },
    {
      header: 'Project Name',
      accessor: 'project_name',
    },
    {
      header: 'Customer',
      accessor: 'customer_name',
    },
    {
      header: 'Budget',
      render: (row) => formatCurrency(row.budget),
    },
    {
      header: 'Spent',
      render: (row) => (
        <div>
          <div>{formatCurrency(row.spent)}</div>
          <div className="text-xs text-gray-500">
            {formatPercent((row.spent / row.budget) * 100)}
          </div>
        </div>
      ),
    },
    {
      header: 'Progress',
      render: (row) => (
        <div className="w-full">
          <div className="flex justify-between text-xs mb-1">
            <span>Actual: {formatPercent(row.actual_progress)}</span>
            <span>Planned: {formatPercent(row.planned_progress)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                row.actual_progress >= row.planned_progress ? 'bg-green-600' : 'bg-red-600'
              }`}
              style={{ width: `${Math.min(row.actual_progress, 100)}%` }}
            ></div>
          </div>
        </div>
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
          <button
            onClick={() => handleViewProject(row)}
            className="text-blue-600 hover:text-blue-800"
            title="View Details"
          >
            <FaEye />
          </button>
        </div>
      ),
    },
  ];

  const customerOptions = customers.map((customer) => ({
    value: customer.id,
    label: customer.customer_name,
  }));

  const statusOptions = [
    { value: 'Planning', label: 'Planning' },
    { value: 'Active', label: 'Active' },
    { value: 'On Hold', label: 'On Hold' },
    { value: 'Completed', label: 'Completed' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">Manage all construction projects</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} icon={<FaPlus />}>
          New Project
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          data={projects}
          loading={loading}
          emptyMessage="No projects found"
        />
      </Card>

      {/* Create Project Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Project"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Create Project</Button>
          </>
        }
      >
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Project Code"
              name="project_code"
              value={formData.project_code}
              onChange={handleChange}
              error={errors.project_code}
              placeholder="PRJ001"
              required
            />
            <Input
              label="Project Name"
              name="project_name"
              value={formData.project_name}
              onChange={handleChange}
              error={errors.project_name}
              placeholder="Office Complex Phase 1"
              required
            />
          </div>

          <Select
            label="Customer"
            name="customer_id"
            value={formData.customer_id}
            onChange={handleChange}
            options={customerOptions}
            placeholder="Select customer"
          />

          <Input
            label="Budget"
            name="budget"
            type="number"
            value={formData.budget}
            onChange={handleChange}
            error={errors.budget}
            placeholder="1000000"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              name="start_date"
              type="date"
              value={formData.start_date}
              onChange={handleChange}
            />
            <Input
              label="End Date"
              name="end_date"
              type="date"
              value={formData.end_date}
              onChange={handleChange}
            />
          </div>

          <Input
            label="Location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="New York, NY"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Project description..."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectList;