import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { getPaymentData } from '../../services/api';
import { PaymentData } from '../../types';
import { format, subDays, parseISO, isWithinInterval } from 'date-fns';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Define date range options
const DATE_RANGES = {
  LAST_7_DAYS: '7 days',
  LAST_30_DAYS: '30 days',
  LAST_90_DAYS: '90 days',
  ALL_TIME: 'All time',
  CUSTOM: 'Custom'
};

const PurchasesBarChart: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<PaymentData[]>([]);
  const [dateRange, setDateRange] = useState(DATE_RANGES.LAST_30_DAYS);
  const [startDate, setStartDate] = useState<string>(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  
  // Fetch payment data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await getPaymentData();
        setPaymentData(data);
      } catch (error) {
        console.error('Error fetching payment data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Handle date range change
  useEffect(() => {
    const now = new Date();
    
    switch (dateRange) {
      case DATE_RANGES.LAST_7_DAYS:
        setStartDate(format(subDays(now, 7), 'yyyy-MM-dd'));
        setEndDate(format(now, 'yyyy-MM-dd'));
        setShowCustomDatePicker(false);
        break;
      case DATE_RANGES.LAST_30_DAYS:
        setStartDate(format(subDays(now, 30), 'yyyy-MM-dd'));
        setEndDate(format(now, 'yyyy-MM-dd'));
        setShowCustomDatePicker(false);
        break;
      case DATE_RANGES.LAST_90_DAYS:
        setStartDate(format(subDays(now, 90), 'yyyy-MM-dd'));
        setEndDate(format(now, 'yyyy-MM-dd'));
        setShowCustomDatePicker(false);
        break;
      case DATE_RANGES.ALL_TIME:
        setStartDate('');
        setEndDate('');
        setShowCustomDatePicker(false);
        break;
      case DATE_RANGES.CUSTOM:
        setShowCustomDatePicker(true);
        break;
      default:
        break;
    }
  }, [dateRange]);
  
  // Process data for chart
  const getChartData = () => {
    if (!paymentData.length) return { labels: [], datasets: [] };
    
    // Filter data by date range if needed
    let filteredData = paymentData;
    
    if (dateRange !== DATE_RANGES.ALL_TIME) {
      const start = startDate ? parseISO(startDate) : undefined;
      const end = endDate ? parseISO(endDate) : undefined;
      
      filteredData = paymentData.filter(payment => {
        if (!payment.created_at) return false;
        
        const paymentDate = parseISO(payment.created_at);
        
        if (start && end) {
          return isWithinInterval(paymentDate, { start, end: new Date(end.setHours(23, 59, 59, 999)) });
        } else if (start) {
          return paymentDate >= start;
        } else if (end) {
          return paymentDate <= new Date(end.setHours(23, 59, 59, 999));
        }
        
        return true;
      });
    }
    
    // Group by date
    const purchasesByDate = filteredData.reduce((acc: Record<string, {count: number, total: number}>, payment) => {
      if (!payment.created_at) return acc;
      
      const date = format(parseISO(payment.created_at), 'yyyy-MM-dd');
      
      if (!acc[date]) {
        acc[date] = { count: 0, total: 0 };
      }
      
      acc[date].count += 1;
      acc[date].total += payment.amount || 0;
      
      return acc;
    }, {});
    
    // Sort dates
    const sortedDates = Object.keys(purchasesByDate).sort();
    
    // Prepare chart data
    return {
      labels: sortedDates.map(date => format(parseISO(date), 'MMM dd')),
      datasets: [
        {
          label: 'Purchase Count',
          data: sortedDates.map(date => purchasesByDate[date].count),
          backgroundColor: 'rgba(99, 102, 241, 0.6)',
          borderColor: 'rgb(79, 70, 229)',
          borderWidth: 1,
          yAxisID: 'y',
        },
        {
          label: 'Revenue (₹)',
          data: sortedDates.map(date => purchasesByDate[date].total),
          backgroundColor: 'rgba(16, 185, 129, 0.6)',
          borderColor: 'rgb(5, 150, 105)',
          borderWidth: 1,
          yAxisID: 'y1',
        }
      ]
    };
  };
  
  // Chart options
  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Purchase Count'
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'Revenue (₹)'
        }
      },
    },
  };
  
  // Calculate summary stats
  const getSummaryStats = () => {
    if (!paymentData.length) return { totalPurchases: 0, totalRevenue: 0 };
    
    // Filter data by date range if needed
    let filteredData = paymentData;
    
    if (dateRange !== DATE_RANGES.ALL_TIME) {
      const start = startDate ? parseISO(startDate) : undefined;
      const end = endDate ? parseISO(endDate) : undefined;
      
      filteredData = paymentData.filter(payment => {
        if (!payment.created_at) return false;
        
        const paymentDate = parseISO(payment.created_at);
        
        if (start && end) {
          return isWithinInterval(paymentDate, { start, end: new Date(end.setHours(23, 59, 59, 999)) });
        } else if (start) {
          return paymentDate >= start;
        } else if (end) {
          return paymentDate <= new Date(end.setHours(23, 59, 59, 999));
        }
        
        return true;
      });
    }
    
    const totalPurchases = filteredData.length;
    const totalRevenue = filteredData.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    
    return { totalPurchases, totalRevenue };
  };
  
  const { totalPurchases, totalRevenue } = getSummaryStats();
  
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <CardTitle className="text-lg font-medium">Purchases Over Time</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2">
            <select 
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              aria-label="Select date range"
              title="Select date range"
            >
              <option value={DATE_RANGES.LAST_7_DAYS}>Last 7 days</option>
              <option value={DATE_RANGES.LAST_30_DAYS}>Last 30 days</option>
              <option value={DATE_RANGES.LAST_90_DAYS}>Last 90 days</option>
              <option value={DATE_RANGES.ALL_TIME}>All time</option>
              <option value={DATE_RANGES.CUSTOM}>Custom range</option>
            </select>
            
            {showCustomDatePicker && (
              <div className="flex gap-2">
                <input
                  type="date"
                  className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  aria-label="Start date"
                  title="Start date"
                />
                <span className="self-center">to</span>
                <input
                  type="date"
                  className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  aria-label="End date"
                  title="End date"
                />
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 mb-4">
          <Bar data={getChartData()} options={chartOptions} />
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-indigo-50 p-3 rounded-md">
            <p className="text-xs text-gray-500">Total Purchases</p>
            <p className="text-lg font-bold">{totalPurchases}</p>
          </div>
          <div className="bg-emerald-50 p-3 rounded-md">
            <p className="text-xs text-gray-500">Total Revenue</p>
            <p className="text-lg font-bold">{formatCurrency(totalRevenue)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PurchasesBarChart;
