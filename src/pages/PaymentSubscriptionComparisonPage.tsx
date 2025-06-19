import React, { useState, useEffect } from 'react';
import { getLeads, getTelegramSubscriptions } from '../services/api';
import { Lead, TelegramSubscription } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Search, RefreshCw, Download, Filter, Calendar, X } from 'lucide-react';

// Type for combined data
interface ComparisonItem {
  lead?: Lead;
  subscription?: TelegramSubscription;
  status: 'matched' | 'lead-only' | 'subscription-only';
}

const PaymentSubscriptionComparisonPage: React.FC = () => {
  const [comparisonData, setComparisonData] = useState<ComparisonItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Stats
  const [stats, setStats] = useState({
    totalLeads: 0,
    totalSubscriptions: 0,
    matched: 0,
    leadOnly: 0,
    subscriptionOnly: 0
  });

  // Function to load and compare data
  const loadComparisonData = async () => {
    try {
      setIsLoading(true);
      setIsSyncing(true);
      setError(null);
      
      // Fetch both leads and subscriptions
      const [leads, subscriptions] = await Promise.all([
        getLeads(),
        getTelegramSubscriptions()
      ]);
      
      // Filter leads to only include intimate talks products
      const intimateTalksLeads = leads.filter(lead => 
        lead.company && lead.company.toLowerCase().includes('intimate talks')
      );
      
      // Create a map of emails to subscriptions for easier lookup
      const subscriptionsByEmail = new Map<string, TelegramSubscription>();
      subscriptions.forEach(sub => {
        if (sub.email) {
          subscriptionsByEmail.set(sub.email.toLowerCase(), sub);
        }
      });
      
      // Create a map of emails to leads for easier lookup
      const leadsByEmail = new Map<string, Lead>();
      intimateTalksLeads.forEach(lead => {
        leadsByEmail.set(lead.email.toLowerCase(), lead);
      });
      
      // Create comparison items
      const comparisonItems: ComparisonItem[] = [];
      
      // Add items where there's a lead but no subscription
      intimateTalksLeads.forEach(lead => {
        const email = lead.email.toLowerCase();
        const subscription = subscriptionsByEmail.get(email);
        
        if (subscription) {
          comparisonItems.push({
            lead,
            subscription,
            status: 'matched'
          });
        } else {
          comparisonItems.push({
            lead,
            status: 'lead-only'
          });
        }
      });
      
      // Add items where there's a subscription but no lead
      subscriptions.forEach(subscription => {
        if (subscription.email) {
          const email = subscription.email.toLowerCase();
          if (!leadsByEmail.has(email)) {
            comparisonItems.push({
              subscription,
              status: 'subscription-only'
            });
          }
        }
      });
      
      // Update stats
      setStats({
        totalLeads: intimateTalksLeads.length,
        totalSubscriptions: subscriptions.length,
        matched: comparisonItems.filter(item => item.status === 'matched').length,
        leadOnly: comparisonItems.filter(item => item.status === 'lead-only').length,
        subscriptionOnly: comparisonItems.filter(item => item.status === 'subscription-only').length
      });
      
      setComparisonData(comparisonItems);
    } catch (err) {
      console.error('Error loading comparison data:', err);
      setError('Failed to load comparison data. Please try again.');
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadComparisonData();
  }, []);

  // Apply all filters
  const filteredData = comparisonData.filter(item => {
    // Apply search filter
    const searchLower = searchTerm.toLowerCase();
    let matchesSearch = true;
    
    if (searchTerm) {
      matchesSearch = false;
      // Search in lead data
      if (item.lead) {
        if (
          item.lead.email.toLowerCase().includes(searchLower) ||
          item.lead.name.toLowerCase().includes(searchLower) ||
          (item.lead.phone && item.lead.phone.toString().includes(searchLower))
        ) {
          matchesSearch = true;
        }
      }
      
      // Search in subscription data
      if (item.subscription && !matchesSearch) {
        if (
          (item.subscription.email && item.subscription.email.toLowerCase().includes(searchLower)) ||
          item.subscription.customer_name.toLowerCase().includes(searchLower) ||
          item.subscription.telegram_username.toLowerCase().includes(searchLower) ||
          (item.subscription.phone_number && item.subscription.phone_number.includes(searchLower))
        ) {
          matchesSearch = true;
        }
      }
    }
    
    // Apply status filter
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    // Apply date filter for subscriptions
    let matchesDate = true;
    if (startDate || endDate) {
      if (item.subscription) {
        const subscriptionDate = new Date(item.subscription.expiry_date);
        
        if (startDate) {
          const filterStartDate = new Date(startDate);
          if (subscriptionDate < filterStartDate) {
            matchesDate = false;
          }
        }
        
        if (endDate) {
          const filterEndDate = new Date(endDate);
          if (subscriptionDate > filterEndDate) {
            matchesDate = false;
          }
        }
      } else {
        // If no subscription and date filter is active, don't show lead-only items
        matchesDate = false;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Function to get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'matched':
        return 'bg-green-100 text-green-800';
      case 'lead-only':
        return 'bg-yellow-100 text-yellow-800';
      case 'subscription-only':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to get status display text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'matched':
        return 'Matched';
      case 'lead-only':
        return 'Lead Only';
      case 'subscription-only':
        return 'Subscription Only';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Intimate Talks Leads & Telegram Subscription Comparison</CardTitle>
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
          <CardTitle>Intimate Talks Leads & Telegram Subscription Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">{error}</p>
            <button 
              onClick={() => loadComparisonData()}
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
          <CardTitle>Intimate Talks Leads & Telegram Subscription Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search, Filter and Refresh Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search by email, name or username"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters {showFilters ? '▲' : '▼'}
              </button>
              
              <button
                onClick={() => {
                  const csvContent = generateCSV(filteredData);
                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.setAttribute('href', url);
                  link.setAttribute('download', `comparison-data-${new Date().toISOString().split('T')[0]}.csv`);
                  link.style.visibility = 'hidden';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
              
              <button
                onClick={() => loadComparisonData()}
                disabled={isSyncing}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                Refresh Data
              </button>
            </div>
          </div>
          
          {/* Advanced Filters */}
          {showFilters && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Advanced Filters</h3>
                <button 
                  onClick={() => {
                    setStatusFilter('all');
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="text-sm text-blue-500 hover:text-blue-700 flex items-center gap-1"
                >
                  <X className="h-3 w-3" /> Clear Filters
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="all">All Statuses</option>
                    <option value="matched">Matched</option>
                    <option value="lead-only">Lead Only</option>
                    <option value="subscription-only">Subscription Only</option>
                  </select>
                </div>
                
                {/* Date Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Start Date</label>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="block w-full pl-2 pr-3 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subscription End Date</label>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="block w-full pl-2 pr-3 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Total Records</h3>
              <div className="mt-2 flex justify-between">
                <div>
                  <p className="text-sm text-gray-500">Intimate Talks Leads</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalLeads}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Telegram Subscriptions</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalSubscriptions}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Matched Records</h3>
              <p className="text-sm text-gray-500 mt-1">Records with both lead and subscription</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{stats.matched}</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Unmatched Records</h3>
              <div className="mt-2 flex justify-between">
                <div>
                  <p className="text-sm text-gray-500">Lead Only</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.leadOnly}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Subscription Only</p>
                  <p className="text-2xl font-bold text-red-600">{stats.subscriptionOnly}</p>
                </div>
              </div>
            </div>
          </div>

          {filteredData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-lg font-medium text-gray-900 mb-1">No records found</p>
              <p className="text-gray-500">Try adjusting your search criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lead Details
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subscription Details
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.map((item, index) => {
                    const email = item.lead?.email || item.subscription?.email || 'N/A';
                    const phone = item.lead?.phone || item.subscription?.phone_number || 'N/A';
                    
                    return (
                      <tr 
                        key={index}
                        className={`hover:bg-gray-100 transition-colors duration-150 ease-in-out ${
                          item.status === 'matched' ? 'bg-green-50' : 
                          item.status === 'lead-only' ? 'bg-yellow-50' : 'bg-red-50'
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {phone}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {item.lead ? (
                            <div>
                              <p><span className="font-medium">Name:</span> {item.lead.name}</p>
                              <p><span className="font-medium">Product:</span> {item.lead.company}</p>
                              <p><span className="font-medium">Amount:</span> ₹{item.lead.value}</p>
                              <p><span className="font-medium">Status:</span> {item.lead.status}</p>
                            </div>
                          ) : (
                            <span className="text-red-500">No lead record</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {item.subscription ? (
                            <div>
                              <p><span className="font-medium">Name:</span> {item.subscription.customer_name}</p>
                              <p><span className="font-medium">Username:</span> {item.subscription.telegram_username}</p>
                              <p><span className="font-medium">Plan:</span> {item.subscription.plan_name} ({item.subscription.plan_duration})</p>
                              <p><span className="font-medium">Expiry:</span> {new Date(item.subscription.expiry_date).toLocaleDateString()}</p>
                            </div>
                          ) : (
                            <span className="text-red-500">No subscription record</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span 
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(item.status)}`}
                          >
                            {getStatusText(item.status)}
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

// Function to generate CSV data from comparison items
const generateCSV = (data: ComparisonItem[]): string => {
  // Define CSV headers
  const headers = [
    'Email',
    'Phone',
    'Status',
    'Lead Name',
    'Lead Product',
    'Lead Amount',
    'Lead Status',
    'Subscription Name',
    'Telegram Username',
    'Subscription Plan',
    'Subscription Duration',
    'Expiry Date'
  ];
  
  // Convert data to CSV rows
  const rows = data.map(item => {
    const email = item.lead?.email || item.subscription?.email || '';
    const phone = item.lead?.phone || item.subscription?.phone_number || '';
    
    return [
      `"${email}"`,
      `"${phone}"`,
      `"${item.status}"`,
      `"${item.lead?.name || ''}"`,
      `"${item.lead?.company || ''}"`,
      `"${item.lead?.value || ''}"`,
      `"${item.lead?.status || ''}"`,
      `"${item.subscription?.customer_name || ''}"`,
      `"${item.subscription?.telegram_username || ''}"`,
      `"${item.subscription?.plan_name || ''}"`,
      `"${item.subscription?.plan_duration || ''}"`,
      `"${item.subscription?.expiry_date ? new Date(item.subscription.expiry_date).toLocaleDateString() : ''}"`,
    ].join(',');
  });
  
  // Combine headers and rows
  return [headers.join(','), ...rows].join('\n');
};

export default PaymentSubscriptionComparisonPage;
