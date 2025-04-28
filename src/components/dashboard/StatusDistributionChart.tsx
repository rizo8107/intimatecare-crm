import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { LeadStatus } from '../../types';
import { getDashboardSummary } from '../../services/api';

const StatusDistributionChart: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [data, setData] = React.useState<Record<LeadStatus, number>>({} as Record<LeadStatus, number>);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const summary = await getDashboardSummary();
        setData(summary.leadsByStatus);
      } catch (error) {
        console.error('Error fetching status distribution data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const statusColors: Record<LeadStatus, string> = {
    'new': '#3B82F6', // blue
    'contacted': '#6366F1', // indigo
    'qualified': '#8B5CF6', // violet
    'negotiation': '#F59E0B', // amber
    'closed-won': '#10B981', // emerald
    'closed-lost': '#EF4444', // red
  };

  const statusLabels: Record<LeadStatus, string> = {
    'new': 'New',
    'contacted': 'Contacted',
    'qualified': 'Qualified',
    'negotiation': 'Negotiation',
    'closed-won': 'Closed (Won)',
    'closed-lost': 'Closed (Lost)',
  };

  // Simple rendering of status distribution as bars
  const renderChart = () => {
    const total = Object.values(data).reduce((sum, count) => sum + count, 0);
    if (total === 0) return null;

    return (
      <div className="space-y-4">
        {Object.entries(data).map(([status, count]) => {
          const typedStatus = status as LeadStatus;
          const percentage = Math.round((count / total) * 100);
          
          return (
            <div key={status} className="space-y-1">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: statusColors[typedStatus] }}
                  ></div>
                  <span className="text-sm font-medium">{statusLabels[typedStatus]}</span>
                </div>
                <span className="text-sm text-gray-500">{count} ({percentage}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="h-2.5 rounded-full transition-all duration-500 ease-in-out" 
                  style={{ 
                    width: `${percentage}%`, 
                    backgroundColor: statusColors[typedStatus] 
                  }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Lead Status Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse space-y-3 py-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                </div>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : Object.keys(data).length === 0 ? (
          <div className="flex justify-center items-center py-12 text-gray-500">
            No data available
          </div>
        ) : (
          <div ref={chartRef}>
            {renderChart()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatusDistributionChart;