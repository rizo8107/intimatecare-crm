import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Eye, Edit, Trash, Filter, RefreshCw, CreditCard, MessageCircle, Book, Database, Link, ChevronUp, ChevronDown, X, SlidersHorizontal } from 'lucide-react';
import Button from '../ui/Button';
import StatusBadge from '../ui/StatusBadge';
import { LeadStatus } from '../../types';
import Pagination from '../ui/Pagination';

// Sorting types
type SortField = 'company' | 'status' | 'value' | 'lastContactedAt' | 'linkedData' | null;
type SortDirection = 'asc' | 'desc';

// Filter types
type FilterOptions = {
  company: string;
  status: LeadStatus | 'all';
  valueMin: number;
  valueMax: number;
  lastContactMin: string;
  lastContactMax: string;
  hasLinkedData: 'all' | 'yes' | 'no';
};

const LeadsList: React.FC = () => {
  const { 
    filteredLeads, 
    isLoading, 
    isSyncing, 
    statusFilter, 
    setStatusFilter, 
    syncPaymentsToLeads, 
    syncAllData,
    getTelegramSubscriptionForLead,
    getEbookAccessForLead,
    error 
  } = useAppContext();
  
  // State for the lead being viewed in detail modal
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  
  // Advanced filtering state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<FilterOptions>({
    company: '',
    status: 'all',
    valueMin: 0,
    valueMax: 1000000,
    lastContactMin: '',
    lastContactMax: '',
    hasLinkedData: 'all'
  });
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();
  
  // Apply advanced filters
  const advancedFilteredLeads = useMemo(() => {
    return filteredLeads.filter(lead => {
      // Company filter
      if (advancedFilters.company && !lead.company.toLowerCase().includes(advancedFilters.company.toLowerCase())) {
        return false;
      }
      
      // Status filter (already handled by the main filter, but included here for completeness)
      if (advancedFilters.status !== 'all' && lead.status !== advancedFilters.status) {
        return false;
      }
      
      // Value range filter
      if (lead.value < advancedFilters.valueMin || lead.value > advancedFilters.valueMax) {
        return false;
      }
      
      // Last contact date filter
      if (advancedFilters.lastContactMin && lead.lastContactedAt) {
        const lastContactDate = new Date(lead.lastContactedAt);
        const minDate = new Date(advancedFilters.lastContactMin);
        if (lastContactDate < minDate) {
          return false;
        }
      }
      
      if (advancedFilters.lastContactMax && lead.lastContactedAt) {
        const lastContactDate = new Date(lead.lastContactedAt);
        const maxDate = new Date(advancedFilters.lastContactMax);
        if (lastContactDate > maxDate) {
          return false;
        }
      }
      
      // Linked data filter
      if (advancedFilters.hasLinkedData === 'yes' && !lead.hasTelegramSubscription && !lead.hasEbookAccess) {
        return false;
      }
      
      if (advancedFilters.hasLinkedData === 'no' && (lead.hasTelegramSubscription || lead.hasEbookAccess)) {
        return false;
      }
      
      return true;
    });
  }, [filteredLeads, advancedFilters]);
  
  // Apply sorting
  const sortedLeads = useMemo(() => {
    if (!sortField) return advancedFilteredLeads;
    
    return [...advancedFilteredLeads].sort((a, b) => {
      let compareResult = 0;
      let aHasLinked: number;
      let bHasLinked: number;
      
      switch (sortField) {
        case 'company':
          compareResult = a.company.localeCompare(b.company);
          break;
        case 'status':
          compareResult = a.status.localeCompare(b.status);
          break;
        case 'value':
          compareResult = a.value - b.value;
          break;
        case 'lastContactedAt':
          // Handle null values
          if (!a.lastContactedAt && !b.lastContactedAt) compareResult = 0;
          else if (!a.lastContactedAt) compareResult = -1;
          else if (!b.lastContactedAt) compareResult = 1;
          else compareResult = new Date(a.lastContactedAt).getTime() - new Date(b.lastContactedAt).getTime();
          break;
        case 'linkedData':
          aHasLinked = a.hasTelegramSubscription || a.hasEbookAccess ? 1 : 0;
          bHasLinked = b.hasTelegramSubscription || b.hasEbookAccess ? 1 : 0;
          compareResult = aHasLinked - bHasLinked;
          break;
        default:
          return 0;
      }
      
      return sortDirection === 'asc' ? compareResult : -compareResult;
    });
  }, [advancedFilteredLeads, sortField, sortDirection]);
  
  // Calculate paginated leads
  const paginatedLeads = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedLeads.slice(startIndex, endIndex);
  }, [sortedLeads, currentPage, itemsPerPage]);

  useEffect(() => {
    setSelectedLead(null);
    setCurrentPage(1);
  }, [filteredLeads]);

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if already sorting by this field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
    
    // Reset to first page when sorting changes
    setCurrentPage(1);
  };

  // Reset all filters
  const resetFilters = () => {
    setAdvancedFilters({
      company: '',
      status: 'all',
      valueMin: 0,
      valueMax: 1000000,
      lastContactMin: '',
      lastContactMax: '',
      hasLinkedData: 'all'
    });
    setStatusFilter('all');
    setSortField(null);
    setSortDirection('asc');
  };

  // Handle filter changes
  const handleFilterChange = <T extends keyof FilterOptions>(field: T, value: FilterOptions[T]) => {
    setAdvancedFilters(prev => ({
      ...prev,
      [field]: value
    }));
    
    // If changing status in advanced filters, also update the main status filter
    if (field === 'status') {
      setStatusFilter(value as LeadStatus | 'all');
    }
    
    // Reset to first page when filters change
    setCurrentPage(1);
  };

  const statusOptions: { value: LeadStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'All Status' },
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'negotiation', label: 'Negotiation' },
    { value: 'closed-won', label: 'Closed (Won)' },
    { value: 'closed-lost', label: 'Closed (Lost)' },
  ];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <Filter size={20} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter by:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              const value = e.target.value as LeadStatus | 'all';
              setStatusFilter(value);
              handleFilterChange('status', value);
            }}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-sm"
            aria-label="Filter leads by status"
            title="Filter leads by status"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center space-x-1 ml-2"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            title="Toggle advanced filters"
          >
            <SlidersHorizontal size={16} />
            <span>{showAdvancedFilters ? 'Hide Filters' : 'Advanced Filters'}</span>
          </Button>
        </div>
        <div className="flex space-x-2">
          <Button
            className="flex items-center space-x-1"
            onClick={syncAllData}
            disabled={isSyncing}
            variant="secondary"
            title="Sync and link all data sources"
          >
            <Database size={16} />
            <span>Sync All Data</span>
            {isSyncing && <RefreshCw size={16} className="animate-spin ml-1" />}
          </Button>
          <Button
            className="flex items-center space-x-1"
            onClick={syncPaymentsToLeads}
            disabled={isSyncing}
            variant="secondary"
            title="Sync payment data to leads"
          >
            <CreditCard size={16} />
            <span>Sync Payments</span>
            {isSyncing && <RefreshCw size={16} className="animate-spin ml-1" />}
          </Button>
        </div>
        <div className="text-sm text-gray-600">
          {sortedLeads.length} {sortedLeads.length === 1 ? 'lead' : 'leads'} found
          {sortedLeads.length > itemsPerPage && (
            <span className="ml-1">
              (showing page {currentPage} of {Math.ceil(sortedLeads.length / itemsPerPage)})
            </span>
          )}
        </div>
      </div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md border border-red-200">
          {error}
        </div>
      )}
      
      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-md font-medium">Advanced Filters</h3>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetFilters}
                className="text-sm"
              >
                Reset Filters
              </Button>
              <button 
                onClick={() => setShowAdvancedFilters(false)} 
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close advanced filters"
                title="Close advanced filters"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Company Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <input
                type="text"
                value={advancedFilters.company}
                onChange={(e) => handleFilterChange('company', e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-sm"
                placeholder="Filter by company name"
              />
            </div>
            
            {/* Value Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Value Range (₹)</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={advancedFilters.valueMin}
                  onChange={(e) => handleFilterChange('valueMin', Number(e.target.value))}
                  className="w-1/2 rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-sm"
                  placeholder="Min"
                  min="0"
                />
                <input
                  type="number"
                  value={advancedFilters.valueMax}
                  onChange={(e) => handleFilterChange('valueMax', Number(e.target.value))}
                  className="w-1/2 rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-sm"
                  placeholder="Max"
                  min="0"
                />
              </div>
            </div>
            
            {/* Last Contact Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Contact Date</label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={advancedFilters.lastContactMin}
                  onChange={(e) => handleFilterChange('lastContactMin', e.target.value)}
                  className="w-1/2 rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-sm"
                  aria-label="From date"
                  title="From date"
                />
                <input
                  type="date"
                  value={advancedFilters.lastContactMax}
                  onChange={(e) => handleFilterChange('lastContactMax', e.target.value)}
                  className="w-1/2 rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-sm"
                  aria-label="To date"
                  title="To date"
                />
              </div>
            </div>
            
            {/* Linked Data Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Has Linked Data</label>
              <select
                value={advancedFilters.hasLinkedData}
                onChange={(e) => handleFilterChange('hasLinkedData', e.target.value as 'all' | 'yes' | 'no')}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-sm"
                aria-label="Filter by linked data"
                title="Filter by linked data"
              >
                <option value="all">All Leads</option>
                <option value="yes">With Linked Data</option>
                <option value="no">Without Linked Data</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {filteredLeads.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-lg font-medium text-gray-900 mb-1">No leads found</p>
              <p className="text-gray-500 mb-4">Try adjusting your search or filter to find what you're looking for.</p>
              <Button
                variant="primary"
                onClick={() => navigate('/leads/new')}
              >
                Add New Lead
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('company')}
                  >
                    <div className="flex items-center">
                      <span>Company</span>
                      {sortField === 'company' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center">
                      <span>Status</span>
                      {sortField === 'status' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('value')}
                  >
                    <div className="flex items-center">
                      <span>Value</span>
                      {sortField === 'value' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('lastContactedAt')}
                  >
                    <div className="flex items-center">
                      <span>Last Contact</span>
                      {sortField === 'lastContactedAt' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('linkedData')}
                  >
                    <div className="flex items-center">
                      <span>Linked Data</span>
                      {sortField === 'linkedData' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </span>
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedLeads.map((lead) => (
                  <tr 
                    key={lead.id}
                    className="hover:bg-gray-50 transition-colors duration-150 ease-in-out"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                          <div className="text-sm text-gray-500">{lead.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{lead.company}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₹{lead.value.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lead.lastContactedAt 
                        ? new Date(lead.lastContactedAt).toLocaleDateString() 
                        : "Never"
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {lead.hasTelegramSubscription && (
                          <div 
                            className="flex items-center text-blue-600 hover:text-blue-800 cursor-pointer" 
                            title="Has Telegram subscription"
                            onClick={() => setSelectedLead(lead.id)}
                          >
                            <MessageCircle size={18} />
                          </div>
                        )}
                        {lead.hasEbookAccess && (
                          <div 
                            className="flex items-center text-green-600 hover:text-green-800 cursor-pointer" 
                            title="Has eBook access"
                            onClick={() => setSelectedLead(lead.id)}
                          >
                            <Book size={18} />
                          </div>
                        )}
                        {!lead.hasTelegramSubscription && !lead.hasEbookAccess && (
                          <div className="text-gray-400 flex items-center" title="No linked data">
                            <Link size={18} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => navigate(`/leads/view/${lead.id}`)}
                        className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                        title="View lead details"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => navigate(`/leads/edit/${lead.id}`)}
                        className="text-yellow-600 hover:text-yellow-900 inline-flex items-center"
                        title="Edit lead"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => window.confirm('Are you sure you want to delete this lead?') && console.log('Delete lead', lead.id)}
                        className="text-red-600 hover:text-red-900 inline-flex items-center"
                        title="Delete lead"
                      >
                        <Trash size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {filteredLeads.length > itemsPerPage && (
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredLeads.length / itemsPerPage)}
              onPageChange={(page) => {
                setCurrentPage(page);
                // Scroll to top of the table when changing pages
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}
        </div>
      )}
      {/* Lead Data Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Linked Data</h3>
              <button 
                onClick={() => setSelectedLead(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>

            <div className="space-y-6">
              {/* Telegram Subscription Data */}
              <div>
                <h4 className="text-md font-medium flex items-center mb-2">
                  <MessageCircle size={18} className="mr-2 text-blue-600" />
                  Telegram Subscription
                </h4>
                {getTelegramSubscriptionForLead(selectedLead) ? (
                  <div className="bg-gray-50 p-4 rounded-md">
                    {(() => {
                      const sub = getTelegramSubscriptionForLead(selectedLead);
                      if (!sub) return null;
                      
                      const daysRemaining = Math.ceil(
                        (new Date(sub.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                      );
                      
                      return (
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="font-medium">Username:</div>
                          <div>{sub.telegram_username}</div>
                          
                          <div className="font-medium">Phone:</div>
                          <div>{sub.phone_number || 'N/A'}</div>
                          
                          <div className="font-medium">Plan:</div>
                          <div>{sub.plan_name}</div>
                          
                          <div className="font-medium">Duration:</div>
                          <div>{sub.plan_duration}</div>
                          
                          <div className="font-medium">Start Date:</div>
                          <div>{new Date(sub.start_date).toLocaleDateString()}</div>
                          
                          <div className="font-medium">Expiry Date:</div>
                          <div>{new Date(sub.expiry_date).toLocaleDateString()}</div>
                          
                          <div className="font-medium">Status:</div>
                          <div>
                            <span 
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${daysRemaining > 7 ? 'bg-green-100 text-green-800' : ''}
                                ${daysRemaining > 0 && daysRemaining <= 7 ? 'bg-yellow-100 text-yellow-800' : ''}
                                ${daysRemaining <= 0 ? 'bg-red-100 text-red-800' : ''}
                              `}
                            >
                              {daysRemaining > 7 ? 'Active' : ''}
                              {daysRemaining > 0 && daysRemaining <= 7 ? 'Expiring Soon' : ''}
                              {daysRemaining <= 0 ? 'Expired' : ''}
                            </span>
                          </div>
                        </div>
                      );
                    })()} 
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No Telegram subscription data linked to this lead.</p>
                )}
              </div>

              {/* eBook Access Data */}
              <div>
                <h4 className="text-md font-medium flex items-center mb-2">
                  <Book size={18} className="mr-2 text-green-600" />
                  eBook Access
                </h4>
                {getEbookAccessForLead(selectedLead) ? (
                  <div className="bg-gray-50 p-4 rounded-md">
                    {(() => {
                      const ebook = getEbookAccessForLead(selectedLead);
                      if (!ebook) return null;
                      
                      return (
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="font-medium">User Name:</div>
                          <div>{ebook.user_name}</div>
                          
                          <div className="font-medium">Email:</div>
                          <div>{ebook.user_email}</div>
                          
                          <div className="font-medium">Payment ID:</div>
                          <div>{ebook.payment_id}</div>
                          
                          <div className="font-medium">Amount:</div>
                          <div>₹{ebook.amount.toLocaleString()}</div>
                          
                          <div className="font-medium">Purchase Date:</div>
                          <div>{new Date(ebook.created_at).toLocaleDateString()}</div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No eBook access data linked to this lead.</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button 
                variant="secondary" 
                onClick={() => setSelectedLead(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsList;