import React, { useState, useEffect, useMemo } from 'react';
import { getTelegramSubscriptions } from '../services/api';
import { TelegramSubscription } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Filter, Search } from 'lucide-react';

// Helper function to format phone number with country code
const formatPhoneNumber = (phoneNumber: string): string => {
  // If the phone number starts with country code (e.g., 91), format it properly
  if (phoneNumber.startsWith('91') || phoneNumber.startsWith('+91')) {
    const cleaned = phoneNumber.replace(/\D/g, '');
    const match = cleaned.match(/^(91)?([0-9]{10})$/);
    
    if (match) {
      return `+91 ${match[2].replace(/(.{5})(.{5})/, '$1 $2')}`;
    }
  }
  
  // For other formats, just return as is
  return phoneNumber;
};

// Helper function to calculate days remaining
const calculateDaysRemaining = (expiryDate: string): number => {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Helper function to get subscription status
const getSubscriptionStatus = (daysRemaining: number): 'active' | 'expiring-soon' | 'expired' => {
  if (daysRemaining <= 0) return 'expired';
  if (daysRemaining <= 7) return 'expiring-soon';
  return 'active';
};

const TelegramSubscriptionsPage: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<TelegramSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        setIsLoading(true);
        const data = await getTelegramSubscriptions();
        setSubscriptions(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching telegram subscriptions:', err);
        setError('Failed to load telegram subscriptions. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptions();
  }, []);

  // Extract unique plan names for filter dropdown
  const uniquePlans = useMemo(() => {
    const plans = subscriptions.map(sub => sub.plan_name);
    return ['all', ...Array.from(new Set(plans))];
  }, [subscriptions]);

  // Filter subscriptions based on search term and filters
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter(subscription => {
      const daysRemaining = calculateDaysRemaining(subscription.expiry_date);
      const status = getSubscriptionStatus(daysRemaining);
      
      // Apply search filter
      const matchesSearch = 
        subscription.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subscription.telegram_username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (subscription.phone_number && subscription.phone_number.toString().includes(searchTerm));
      
      // Apply plan filter
      const matchesPlan = planFilter === 'all' || subscription.plan_name === planFilter;
      
      // Apply status filter
      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'active' && status === 'active') ||
        (statusFilter === 'expiring-soon' && status === 'expiring-soon') ||
        (statusFilter === 'expired' && status === 'expired');
      
      return matchesSearch && matchesPlan && matchesStatus;
    });
  }, [subscriptions, searchTerm, planFilter, statusFilter]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Telegram Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Telegram Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Telegram Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search by name or username"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  aria-label="Filter by plan"
                >
                  {uniquePlans.map(plan => (
                    <option key={plan} value={plan}>
                      {plan === 'all' ? 'All Plans' : plan}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <select
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Filter by subscription status"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="expiring-soon">Expiring Soon</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>
          </div>
          {filteredSubscriptions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-lg font-medium text-gray-900 mb-1">No subscriptions found</p>
              <p className="text-gray-500">There are currently no Telegram subscriptions in the system.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Telegram Username
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Telegram ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone Number
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expiry Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Remaining Time
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSubscriptions.map((subscription) => {
                    const daysRemaining = calculateDaysRemaining(subscription.expiry_date);
                    const status = getSubscriptionStatus(daysRemaining);
                    
                    return (
                    <tr 
                      key={subscription.id}
                      className="hover:bg-gray-50 transition-colors duration-150 ease-in-out"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {subscription.customer_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {subscription.telegram_username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {subscription.telegram_user_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {subscription.phone_number ? formatPhoneNumber(subscription.phone_number) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {subscription.plan_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {subscription.plan_duration}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(subscription.start_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(subscription.expiry_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {daysRemaining > 0 
                          ? `${daysRemaining} days` 
                          : 'Expired'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span 
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${status === 'active' ? 'bg-green-100 text-green-800' : ''}
                            ${status === 'expiring-soon' ? 'bg-yellow-100 text-yellow-800' : ''}
                            ${status === 'expired' ? 'bg-red-100 text-red-800' : ''}
                          `}
                        >
                          {status === 'active' ? 'Active' : ''}
                          {status === 'expiring-soon' ? 'Expiring Soon' : ''}
                          {status === 'expired' ? 'Expired' : ''}
                        </span>
                      </td>
                    </tr>
                  );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TelegramSubscriptionsPage;
