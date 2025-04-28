import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Users, CheckCircle2, IndianRupee, BarChart2 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { getDashboardSummary } from '../../services/api';

const DashboardSummary: React.FC = () => {
  const [summary, setSummary] = React.useState({
    totalLeads: 0,
    newLeadsThisWeek: 0,
    leadsClosedThisMonth: 0,
    totalValue: 0,
    upcomingTasks: 0,
  });
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchSummary = async () => {
      try {
        setIsLoading(true);
        const data = await getDashboardSummary();
        setSummary(data);
      } catch (error) {
        console.error('Error fetching dashboard summary:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const summaryCards = [
    {
      title: 'Total Leads',
      value: summary.totalLeads,
      icon: <Users className="h-8 w-8 text-blue-600" />,
      description: `${summary.newLeadsThisWeek} new this week`,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Deals Closed',
      value: summary.leadsClosedThisMonth,
      icon: <CheckCircle2 className="h-8 w-8 text-emerald-600" />,
      description: 'this month',
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      title: 'Pipeline Value',
      value: `₹${summary.totalValue.toLocaleString('en-IN')}`,
      icon: <IndianRupee className="h-8 w-8 text-amber-600" />,
      description: 'total potential revenue',
      color: 'bg-amber-50 text-amber-600',
    },
    {
      title: 'Upcoming Tasks',
      value: summary.upcomingTasks,
      icon: <BarChart2 className="h-8 w-8 text-purple-600" />,
      description: 'pending actions',
      color: 'bg-purple-50 text-purple-600',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-5 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {summaryCards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-full ${card.color.split(' ')[0]}`}>
              {card.icon}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-gray-500 mt-1">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DashboardSummary;