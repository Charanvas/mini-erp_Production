import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FaTachometerAlt,
  FaProjectDiagram,
  FaFileInvoiceDollar,
  FaChartLine,
  FaUsers,
  FaCog,
  FaMoneyBillWave,
  FaExclamationTriangle,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { user } = useAuth();

  const menuItems = [
    {
      path: '/dashboard',
      icon: <FaTachometerAlt />,
      label: 'Dashboard',
      roles: ['Admin', 'Finance Manager', 'Project Manager', 'User'],
    },
    {
      path: '/projects',
      icon: <FaProjectDiagram />,
      label: 'Projects',
      roles: ['Admin', 'Finance Manager', 'Project Manager'],
    },
    {
      path: '/finance',
      icon: <FaMoneyBillWave />,
      label: 'Finance',
      roles: ['Admin', 'Finance Manager'],
    },
    {
      path: '/invoices',
      icon: <FaFileInvoiceDollar />,
      label: 'Invoices',
      roles: ['Admin', 'Finance Manager'],
    },
    {
      path: '/insights',
      icon: <FaChartLine />,
      label: 'AI Insights',
      roles: ['Admin', 'Finance Manager', 'Project Manager'],
    },
    {
      path: '/risks',
      icon: <FaExclamationTriangle />,
      label: 'Risk Analysis',
      roles: ['Admin', 'Project Manager'],
    },
    {
      path: '/admin/users',
      icon: <FaUsers />,
      label: 'User Management',
      roles: ['Admin'],
    },
    {
      path: '/admin/settings',
      icon: <FaCog />,
      label: 'System Admin',
      roles: ['Admin'],
    },
  ];

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(user?.role)
  );

  return (
    <aside className="bg-gray-900 text-white w-64 fixed left-0 top-0 bottom-0 overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-8">
          <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-xl font-bold">CE</span>
          </div>
          <span className="text-xl font-bold">Construction ERP</span>
        </div>

        <nav>
          <ul className="space-y-2">
            {filteredMenuItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`
                  }
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="p-6 border-t border-gray-800">
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-xs text-gray-400 mb-2">Current User</p>
          <p className="text-sm font-medium">{user?.email}</p>
          <p className="text-xs text-gray-400 mt-1">{user?.role}</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;