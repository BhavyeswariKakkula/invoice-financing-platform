import React from 'react';

interface StatusBadgeProps {
  status: string;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-blue-100 text-blue-700',
  under_verification: 'bg-yellow-100 text-yellow-700',
  verified: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  financed: 'bg-purple-100 text-purple-700',
  closed: 'bg-gray-100 text-gray-700',
  requested: 'bg-blue-100 text-blue-700',
  under_review: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  funded: 'bg-purple-100 text-purple-700',
  repayment: 'bg-orange-100 text-orange-700',
  completed: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  partially_paid: 'bg-orange-100 text-orange-700',
  partial: 'bg-orange-100 text-orange-700',
  overdue: 'bg-red-100 text-red-700',
  requires_correction: 'bg-orange-100 text-orange-700',
  pending_verification: 'bg-yellow-100 text-yellow-700',
  approved_status: 'bg-green-100 text-green-700',
  rejected_status: 'bg-red-100 text-red-700',
  active: 'bg-blue-100 text-blue-700',
  prepaid: 'bg-purple-100 text-purple-700',
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const colorClass = statusColors[status] || 'bg-gray-100 text-gray-700';
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  );
};

export default StatusBadge;
