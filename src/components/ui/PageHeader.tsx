import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backLink?: {
    to: string;
    text: string;
  };
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, backLink }) => {
  return (
    <div className="mb-6">
      {backLink && (
        <Link to={backLink.to} className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-2">
          <ChevronLeft className="w-4 h-4 mr-1" />
          {backLink.text}
        </Link>
      )}
      <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
      {subtitle && <p className="mt-1 text-md text-gray-600">{subtitle}</p>}
    </div>
  );
};
