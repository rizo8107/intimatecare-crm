import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Eye, Edit, Trash, Filter, RefreshCw, CreditCard, MessageCircle, Book, Database, Link } from 'lucide-react';
import Button from '../ui/Button';
import StatusBadge from '../ui/StatusBadge';
import { LeadStatus } from '../../types';

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
  const navigate = useNavigate();

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
            onChange={(e) => setStatusFilter(e.target.value as LeadStatus | 'all')}
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
          {filteredLeads.length} {filteredLeads.length === 1 ? 'lead' : 'leads'} found
        </div>
      </div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md border border-red-200">
          {error}
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
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Contact
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Linked Data
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeads.map((lead) => (
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