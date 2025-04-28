import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { getTelegramSubscriptions, getEbookAccess } from '../../services/api';
import { TelegramSubscription } from '../../types';

// Register the required chart components
ChartJS.register(ArcElement, Tooltip, Legend);

const SalesPieChart: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [telegramData, setTelegramData] = useState<{count: number, total: number}>({ count: 0, total: 0 });
  const [ebookData, setEbookData] = useState<{count: number, total: number}>({ count: 0, total: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch Telegram subscriptions and eBook access data
        const telegramSubscriptions = await getTelegramSubscriptions();
        const ebookAccesses = await getEbookAccess();
        
        // Calculate counts and totals
        // For Telegram, we'll estimate the value based on plan name or duration if available
        const telegramCount = telegramSubscriptions.length;
        const telegramTotal = telegramSubscriptions.reduce((sum, subscription) => {
          // This is a simplified calculation - in a real app, you'd have actual payment data
          const planValue = getPlanValue(subscription);
          return sum + planValue;
        }, 0);
        
        // For eBooks, we'll use the amount field if available
        const ebookCount = ebookAccesses.length;
        const ebookTotal = ebookAccesses.reduce((sum, ebook) => {
          return sum + (ebook.amount || 0);
        }, 0);
        
        setTelegramData({ count: telegramCount, total: telegramTotal });
        setEbookData({ count: ebookCount, total: ebookTotal });
      } catch (error) {
        console.error('Error fetching sales data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Helper function to estimate value of a Telegram subscription
  const getPlanValue = (subscription: TelegramSubscription): number => {
    // This is a simplified calculation - in a real app, you'd have actual payment data
    if (subscription.plan_name?.toLowerCase().includes('premium')) {
      return 999;
    } else if (subscription.plan_name?.toLowerCase().includes('basic')) {
      return 499;
    } else if (subscription.plan_duration?.toLowerCase().includes('year')) {
      return 1999;
    } else if (subscription.plan_duration?.toLowerCase().includes('month')) {
      return 299;
    }
    return 599; // Default value
  };
  
  // Prepare chart data
  const chartData = {
    labels: ['Telegram Subscriptions', 'eBook Sales'],
    datasets: [
      {
        data: [telegramData.count, ebookData.count],
        backgroundColor: ['#6366F1', '#10B981'],
        borderColor: ['#4F46E5', '#059669'],
        borderWidth: 1,
      },
    ],
  };
  
  // Prepare chart options
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          // Using any type here to avoid complex type issues with ChartJS
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            return `${label}: ${value}`;
          }
        }
      }
    },
  };
  
  // Prepare revenue chart data
  const revenueChartData = {
    labels: ['Telegram Revenue', 'eBook Revenue'],
    datasets: [
      {
        data: [telegramData.total, ebookData.total],
        backgroundColor: ['#6366F1', '#10B981'],
        borderColor: ['#4F46E5', '#059669'],
        borderWidth: 1,
      },
    ],
  };
  
  // Format currency
  const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-2">
          <div className="h-5 bg-gray-200 rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Sales Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-center mb-2">Sales Count</h3>
            <div className="h-64">
              <Pie data={chartData} options={chartOptions} />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="bg-indigo-50 p-3 rounded-md">
                <p className="text-xs text-gray-500">Telegram Subscriptions</p>
                <p className="text-lg font-bold">{telegramData.count}</p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-md">
                <p className="text-xs text-gray-500">eBook Sales</p>
                <p className="text-lg font-bold">{ebookData.count}</p>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-center mb-2">Revenue</h3>
            <div className="h-64">
              <Pie data={revenueChartData} options={chartOptions} />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="bg-indigo-50 p-3 rounded-md">
                <p className="text-xs text-gray-500">Telegram Revenue</p>
                <p className="text-lg font-bold">{formatCurrency(telegramData.total)}</p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-md">
                <p className="text-xs text-gray-500">eBook Revenue</p>
                <p className="text-lg font-bold">{formatCurrency(ebookData.total)}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesPieChart;
