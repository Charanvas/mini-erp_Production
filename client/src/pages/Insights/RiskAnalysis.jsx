import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaExclamationTriangle, FaEye } from 'react-icons/fa';
import Card from '../../components/Common/Card';
import Table from '../../components/Common/Table';
import Badge from '../../components/Common/Badge';
import Button from '../../components/Common/Button';
import projectService from '../../services/projectService';
import { formatCurrency, formatPercent, getRiskBadgeClass } from '../../utils/formatters';
import toast from 'react-hot-toast';

const RiskAnalysis = () => {
  const navigate = useNavigate();
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRisks();
  }, []);

  const fetchRisks = async () => {
    try {
      setLoading(true);
      const response = await projectService.getProjectRisks();
      setRisks(response.data.data.risks);
    } catch (error) {
      toast.error('Failed to load risk analysis');
    } finally {
      setLoading(false);
    }
  };

  const getRiskIcon = (level) => {
    const colors = {
      Low: 'text-green-600',
      Medium: 'text-yellow-600',
      High: 'text-orange-600',
      Critical: 'text-red-600',
    };
    return <FaExclamationTriangle className={colors[level]} />;
  };

  const columns = [
    {
      header: 'Project',
      render: (row) => (
        <div>
          <div className="font-medium">{row.project_name}</div>
          <div className="text-xs text-gray-500">{row.project_code}</div>
        </div>
      ),
    },
    {
      header: 'Risk Level',
      render: (row) => (
        <div className="flex items-center space-x-2">
          {getRiskIcon(row.risk_level)}
          <Badge variant={row.risk_level === 'Critical' ? 'danger' : row.risk_level === 'High' ? 'warning' : row.risk_level === 'Medium' ? 'info' : 'success'}>
            {row.risk_level}
          </Badge>
        </div>
      ),
    },
    {
      header: 'Risk Score',
      render: (row) => (
        <div className="flex items-center">
          <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
            <div
              className={`h-2 rounded-full ${
                row.risk_score >= 70 ? 'bg-red-600' :
                row.risk_score >= 50 ? 'bg-orange-600' :
                row.risk_score >= 30 ? 'bg-yellow-600' : 'bg-green-600'
              }`}
              style={{ width: `${row.risk_score}%` }}
            ></div>
          </div>
          <span className="text-sm font-medium">{row.risk_score.toFixed(0)}</span>
        </div>
      ),
    },
    {
      header: 'Key Factors',
      render: (row) => (
        <div className="space-y-1">
          {row.factors.slice(0, 2).map((factor, idx) => (
            <div key={idx} className="text-xs text-gray-600">
              • {factor.factor}
            </div>
          ))}
          {row.factors.length > 2 && (
            <div className="text-xs text-blue-600">+{row.factors.length - 2} more</div>
          )}
        </div>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate(`/projects/${row.project_id}`)}
          icon={<FaEye />}
        >
          View
        </Button>
      ),
    },
  ];

  // Group risks by level
  const risksByLevel = {
    Critical: risks.filter((r) => r.risk_level === 'Critical'),
    High: risks.filter((r) => r.risk_level === 'High'),
    Medium: risks.filter((r) => r.risk_level === 'Medium'),
    Low: risks.filter((r) => r.risk_level === 'Low'),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Risk Analysis</h1>
        <p className="text-gray-600 mt-1">AI-powered project risk assessment</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-red-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Critical Risk</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{risksByLevel.Critical.length}</p>
            </div>
            <FaExclamationTriangle className="text-red-600" size={32} />
          </div>
        </Card>
        <Card className="bg-orange-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">High Risk</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{risksByLevel.High.length}</p>
            </div>
            <FaExclamationTriangle className="text-orange-600" size={32} />
          </div>
        </Card>
        <Card className="bg-yellow-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Medium Risk</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{risksByLevel.Medium.length}</p>
            </div>
            <FaExclamationTriangle className="text-yellow-600" size={32} />
          </div>
        </Card>
        <Card className="bg-green-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Risk</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{risksByLevel.Low.length}</p>
            </div>
            <FaExclamationTriangle className="text-green-600" size={32} />
          </div>
        </Card>
      </div>

      {/* Risk Table */}
      <Card title="Project Risk Assessment">
        <Table columns={columns} data={risks} loading={loading} emptyMessage="No risk data available" />
      </Card>

      {/* Detailed Risk Breakdown */}
      {risksByLevel.Critical.length > 0 && (
        <Card title="Critical Risk Projects" className="border-l-4 border-red-600">
          <div className="space-y-4">
            {risksByLevel.Critical.map((risk) => (
              <div key={risk.project_id} className="p-4 bg-red-50 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{risk.project_name}</h3>
                    <p className="text-sm text-gray-600">{risk.project_code}</p>
                  </div>
                  <Badge variant="danger" size="lg">Risk Score: {risk.risk_score.toFixed(0)}</Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Risk Factors:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {risk.factors.map((factor, idx) => (
                      <li key={idx} className="text-sm text-gray-600">
                        <strong>{factor.factor}:</strong> {factor.description}
                      </li>
                    ))}
                  </ul>
                </div>
                {risk.recommendations && (
                  <div className="mt-3 pt-3 border-t border-red-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Recommendations:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {risk.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-sm text-gray-600">{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default RiskAnalysis;