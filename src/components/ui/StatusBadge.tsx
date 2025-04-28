import React from 'react';
import { LeadStatus } from '../../types';
import Badge from './Badge';

interface StatusBadgeProps {
  status: LeadStatus;
  size?: 'sm' | 'md' | 'lg';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStatusConfig = (status: LeadStatus) => {
    switch (status) {
      case 'new':
        return { label: 'New', variant: 'info' };
      case 'contacted':
        return { label: 'Contacted', variant: 'primary' };
      case 'qualified':
        return { label: 'Qualified', variant: 'secondary' };
      case 'negotiation':
        return { label: 'Negotiation', variant: 'warning' };
      case 'closed-won':
        return { label: 'Closed (Won)', variant: 'success' };
      case 'closed-lost':
        return { label: 'Closed (Lost)', variant: 'danger' };
      default:
        return { label: status, variant: 'default' };
    }
  };

  const { label, variant } = getStatusConfig(status);
  
  return (
    <Badge 
      variant={variant as any} 
      size={size}
    >
      {label}
    </Badge>
  );
};

export default StatusBadge;