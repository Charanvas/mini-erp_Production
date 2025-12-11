// Format currency
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// Format date
export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Format datetime
export const formatDateTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Format percentage
export const formatPercent = (value, decimals = 2) => {
  return `${parseFloat(value).toFixed(decimals)}%`;
};

// Format number
export const formatNumber = (value, decimals = 2) => {
  return parseFloat(value).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

// Get status color
export const getStatusColor = (status) => {
  const colors = {
    // Invoice status
    Draft: 'gray',
    Sent: 'blue',
    Paid: 'green',
    Overdue: 'red',
    Cancelled: 'gray',

    // Project status
    Planning: 'blue',
    Active: 'green',
    'On Hold': 'yellow',
    Completed: 'green',

    // Risk level
    Low: 'green',
    Medium: 'yellow',
    High: 'orange',
    Critical: 'red',

    // Payment status
    Pending: 'yellow',
    Completed: 'green',
    Failed: 'red',
  };

  return colors[status] || 'gray';
};

// Get risk level badge
export const getRiskBadgeClass = (level) => {
  const classes = {
    Low: 'bg-green-100 text-green-800',
    Medium: 'bg-yellow-100 text-yellow-800',
    High: 'bg-orange-100 text-orange-800',
    Critical: 'bg-red-100 text-red-800',
  };

  return classes[level] || 'bg-gray-100 text-gray-800';
};

// Truncate text
export const truncate = (text, length = 50) => {
  if (!text) return '';
  return text.length > length ? `${text.substring(0, length)}...` : text;
};

// Calculate days difference
export const daysDifference = (date1, date2 = new Date()) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = d2 - d1;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Get overdue days
export const getOverdueDays = (dueDate) => {
  const days = daysDifference(dueDate);
  return days > 0 ? days : 0;
};